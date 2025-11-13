import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Env from Edge Function Secrets (no SUPABASE_ prefix)
const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const ANON_KEY = Deno.env.get("ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE")!;
const ALLOW_ORIGIN = Deno.env.get("ALLOW_ORIGIN") ?? "http://localhost:5173";

function withCors(headers: HeadersInit = {}) {
  return {
    "access-control-allow-origin": ALLOW_ORIGIN,
    "access-control-allow-headers": "authorization, content-type, apikey, x-client-info",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-credentials": "true",
    "access-control-max-age": "86400", // 24 hours
    "content-type": "application/json",
    ...headers,
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: withCors(),
  });
}


Deno.serve(async (req) => {
  // Handle CORS preflight FIRST
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin") || "";
    const allowedOrigin = origin.includes("localhost") || origin.includes("127.0.0.1")
      ? origin
      : (ALLOW_ORIGIN || origin || "*");
    
    return new Response("ok", { 
      status: 200, 
      headers: {
        ...withCors(),
        "access-control-allow-origin": allowedOrigin,
      }
    });
  }

  try {
    const url = new URL(req.url);
    let pathname = url.pathname;
    
    // Normalize pathname - handle both cases:
    // 1. Supabase may strip prefix: pathname = "/"
    // 2. Full path may be present: pathname = "/functions/v1/admin-users" or "/admin-users"
    if (pathname.startsWith("/functions/v1/admin-users")) {
      pathname = pathname.replace("/functions/v1/admin-users", "") || "/";
    } else if (pathname.startsWith("/admin-users")) {
      pathname = pathname.replace("/admin-users", "") || "/";
    }
    
    const searchParams = url.searchParams;
    
    console.log("Request:", { method: req.method, originalPathname: url.pathname, normalizedPathname: pathname, url: req.url });
    
    const authHeader = req.headers.get("Authorization") || "";

    // Client using caller's JWT
    const requester = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // Must be logged in
    const { data: me, error: meErr } = await requester.auth.getUser();
    if (meErr || !me?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    
    let userRole: string | null = null;
    
    // Prefer RPC (works regardless of RLS on profiles)
    const { data: rpcRole, error: rpcErr } = await requester.rpc("get_my_role");
    if (!rpcErr && rpcRole) {
      userRole = rpcRole as string;
    } else {
      // Fallback 1: direct read (if you already allow it via RLS)
      const { data: prof, error: profErr } = await requester
        .from("profiles")
        .select("role")
        .eq("id", me.user.id)
        .single();
    
      if (!profErr && prof?.role) {
        userRole = prof.role;
      } else {
        // Fallback 2: service-role read (bypasses RLS)
        const adminCheck = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
          auth: { persistSession: false },
        });
        const { data: prof2, error: profErr2 } = await adminCheck
          .from("profiles")
          .select("role")
          .eq("id", me.user.id)
          .single();
    
        if (!profErr2 && prof2?.role) {
          userRole = prof2.role;
        }
      }
    }
    
    if (userRole !== "admin") {
      return json({ error: "Forbidden", details: `role=${userRole ?? 'null'}` }, 403);
    }
      
      // Method 2: Direct profile query with user's JWT (respects RLS)
      const { data: prof, error: profErr } = await requester
        .from("profiles")
        .select("role")
        .eq("id", me.user.id)
        .single();
      
      if (!profErr && prof?.role) {
        userRole = prof.role;
        console.log("Role check (direct query):", { userId: me.user.id, role: userRole, email: me.user.email });
      } else {
        console.error("Profile lookup error:", profErr, "User ID:", me.user.id);
        
        // Method 3: Service role client as last resort (bypasses RLS)
        const adminCheck = createClient(SUPABASE_URL, SERVICE_ROLE, {
          auth: { persistSession: false },
        });
        const { data: adminProf, error: adminProfErr } = await adminCheck
          .from("profiles")
          .select("role")
          .eq("id", me.user.id)
          .single();
        
        if (!adminProfErr && adminProf?.role) {
          userRole = adminProf.role;
          console.log("Role check (service role):", { userId: me.user.id, role: userRole, email: me.user.email });
        } else {
          console.error("All role check methods failed:", { roleErr, profErr, adminProfErr });
          return json({ 
            error: "Role check failed", 
            details: `Could not determine role. RPC: ${roleErr?.message || 'ok'}, Direct: ${profErr?.message || 'ok'}, Service: ${adminProfErr?.message || 'ok'}`,
            userId: me.user.id 
          }, 500);
        }
      }
    }
    
    // Final role check
    if (userRole !== "admin") {
      console.warn("Access denied - not admin:", { userId: me.user.id, role: userRole, email: me.user.email });
      return json({ 
        error: "Forbidden", 
        details: `Role is '${userRole || 'null'}'. Expected 'admin'.`, 
        userId: me.user.id,
        detectedRole: userRole 
      }, 403);
    }
    
    console.log("Admin access granted:", { userId: me.user.id, email: me.user.email });

    // Admin client (service role)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // GET "/"  → list users
    if (req.method === "GET" && pathname === "/") {
      const q = searchParams.get("query") ?? "";
      const page = Number(searchParams.get("page") ?? "1");
      const size = Number(searchParams.get("perPage") ?? "20");

      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: size,
      });
      if (error) return json({ error: error.message }, 500);

      // roles from profiles
      const userIds = data.users.map((u) => u.id);
      const { data: profiles, error: profsErr } = await admin
        .from("profiles")
        .select("id, role")
        .in("id", userIds);
      if (profsErr) return json({ error: profsErr.message }, 500);

      const roleMap = new Map((profiles ?? []).map((p) => [p.id, p.role]));
      const enriched = data.users.map((u) => ({
        ...u,
        role: roleMap.get(u.id) || "member",
      }));

      const filtered = q
        ? enriched.filter(
            (u) =>
              (u.email || "").toLowerCase().includes(q.toLowerCase()) ||
              (u.user_metadata?.display_name || "")
                .toLowerCase()
                .includes(q.toLowerCase())
          )
        : enriched;

      return json({ users: filtered, page, size, total: data.users.length });
    }

    // POST "/" → create user
    if (req.method === "POST" && pathname === "/") {
      const body = await req.json();
      const { email, password, display_name, role } = body ?? {};

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });
      if (error) return json({ error: error.message }, 500);

      const uid = data.user?.id!;
      const { error: upErr } = await admin
        .from("profiles")
        .upsert({
          id: uid,
          display_name,
          role: role === "admin" ? "admin" : "member",
        });
      if (upErr) return json({ error: upErr.message }, 500);

      return json({ id: uid }, 201);
    }

    // PATCH "/:id" → update user
    if (req.method === "PATCH" && pathname !== "/") {
      const id = pathname.slice(1); // remove leading '/'
      const body = await req.json();

      const updates: Record<string, unknown> = {};
      if (body.password) updates.password = body.password;
      if (body.display_name) updates.user_metadata = { display_name: body.display_name };

      if (Object.keys(updates).length) {
        const { error } = await admin.auth.admin.updateUserById(id, updates);
        if (error) return json({ error: error.message }, 500);
      }

      if (body.role) {
        const { error } = await admin.from("profiles").update({ role: body.role }).eq("id", id);
        if (error) return json({ error: error.message }, 500);
      }

      return json({ ok: true });
    }

    // DELETE "/:id" → ban or hard delete
    if (req.method === "DELETE" && pathname !== "/") {
      const id = pathname.slice(1); // remove leading '/'
      const hard = searchParams.get("hard") === "true";

      if (hard) {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) return json({ error: error.message }, 500);
      } else {
        const { error } = await admin.auth.admin.updateUserById(id, { banned: true });
        if (error) return json({ error: error.message }, 500);
      }
      return json({ ok: true });
    }

    return json({ error: "Not found", pathname }, 404);
  } catch (e) {
    // Always include CORS headers on errors
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: withCors(),
    });
  }
});
