import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Support both naming conventions for environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE")!;

// CORS allow-list: comma-separated in ALLOW_ORIGINS; fallback keeps localhost for dev
const RAW_ALLOWED = Deno.env.get("ALLOW_ORIGINS")
  ?? "http://localhost:5173,https://stuff-cycler.netlify.app";
const ALLOWED_ORIGINS = RAW_ALLOWED.split(",").map(s => s.trim());

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Allow Netlify preview URLs like https://<hash>--stuff-cycler.netlify.app
  try {
    const u = new URL(origin);
    if (u.hostname.endsWith("--stuff-cycler.netlify.app")) return true;
  } catch { /* ignore */ }

  return false;
}

function corsHeadersFor(origin: string | null): HeadersInit {
  // If not allowed, fall back to the first allowed origin (typically localhost in dev)
  const allowOrigin = isAllowedOrigin(origin) ? origin! : (ALLOWED_ORIGINS[0] || "*");
  return {
    "content-type": "application/json",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    // include headers your app actually uses
    "access-control-allow-headers": "authorization, content-type, apikey, x-client-info, prefer, range",
    "access-control-max-age": "86400",
    // ensure caches keep per-origin variants
    "vary": "Origin",
  };
}

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeadersFor(origin),
  });
}

console.log("Edge function starting with env check:", {
  hasUrl: !!SUPABASE_URL,
  hasAnon: !!ANON_KEY,
  hasService: !!SERVICE_ROLE,
  allowedOrigins: ALLOWED_ORIGINS,
});

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeadersFor(origin) });
  }

  try {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Normalize pathname for both invocation styles
    if (pathname.startsWith("/functions/v1/admin-users")) {
      pathname = pathname.replace("/functions/v1/admin-users", "") || "/";
    } else if (pathname.startsWith("/admin-users")) {
      pathname = pathname.replace("/admin-users", "") || "/";
    }

    const authHeader = req.headers.get("Authorization") || "";

    const requester = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // Must be logged in
    const { data: me, error: meErr } = await requester.auth.getUser();
    if (meErr || !me?.user) return json({ error: "Unauthorized" }, 401, origin);

    // ---- role check (RPC first, then fallbacks) ----
    let role: string | null = null;

    const { data: rpcRole, error: rpcErr } = await requester.rpc("get_my_role");
    if (!rpcErr && rpcRole) {
      role = rpcRole as string;
    } else {
      const { data: prof, error: profErr } = await requester
        .from("profiles")
        .select("role")
        .eq("id", me.user.id)
        .single();

      if (!profErr && prof?.role) {
        role = prof.role as string;
      } else {
        const adminCheck = createClient(SUPABASE_URL, SERVICE_ROLE, {
          auth: { persistSession: false },
        });
        const { data: prof2, error: profErr2 } = await adminCheck
          .from("profiles")
          .select("role")
          .eq("id", me.user.id)
          .single();
        if (!profErr2 && prof2?.role) role = prof2.role as string;
      }
    }

    if (role !== "admin") {
      return json({ error: "Forbidden", details: `role=${role ?? "null"}` }, 403, origin);
    }

    // ---- admin actions (service role) ----
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "public" },
      global: { headers: { "x-application-name": "admin-users-function" } },
    });

    // GET "/"  → list users
    if (req.method === "GET" && pathname === "/") {
      const q = url.searchParams.get("query") ?? "";
      const page = Number(url.searchParams.get("page") ?? "1");
      const size = Number(url.searchParams.get("perPage") ?? "20");

      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: size });
      if (error) return json({ error: error.message }, 500, origin);

      const ids = data.users.map((u) => u.id);
      const { data: profs, error: profsErr } = await admin
        .from("profiles")
        .select("id, role")
        .in("id", ids);
      if (profsErr) return json({ error: profsErr.message }, 500, origin);

      const roleMap = new Map((profs ?? []).map((p) => [p.id, p.role]));
      const enriched = data.users.map((u) => ({ ...u, role: roleMap.get(u.id) || "member" }));

      const filtered = q
        ? enriched.filter(
            (u) =>
              (u.email || "").toLowerCase().includes(q.toLowerCase()) ||
              (u.user_metadata?.display_name || "").toLowerCase().includes(q.toLowerCase())
          )
        : enriched;

      return json({ users: filtered, page, size, total: data.users.length }, 200, origin);
    }

    // POST "/" → create user
    if (req.method === "POST" && pathname === "/") {
      const { email, password, display_name, role } = await req.json();
      console.log("Creating user:", { email, display_name, role });

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });

      if (error) {
        console.error("Failed to create auth user:", error);
        return json({ error: error.message, details: error }, 500, origin);
      }

      const uid = data.user.id;
      console.log("Auth user created, upserting profile for:", uid);

      const { error: upErr } = await admin.from("profiles").upsert({
        id: uid,
        display_name,
        role: role === "admin" ? "admin" : "member",
      });

      if (upErr) {
        console.error("Failed to upsert profile:", upErr);
        return json({ error: upErr.message, details: upErr }, 500, origin);
      }

      console.log("User created successfully:", uid);
      return json({ id: uid }, 201, origin);
    }

    // PATCH "/:id" → update user
    if (req.method === "PATCH" && pathname !== "/") {
      const id = pathname.slice(1);
      const body = await req.json();
      console.log("Updating user:", { id, body });

      // Prevent self-demotion
      if (body.role && body.role !== "admin" && id === me.user.id) {
        console.warn("Self-demotion attempt blocked for:", id);
        return json({ error: "Cannot remove your own admin privileges" }, 400, origin);
      }

      const updates: Record<string, unknown> = {};
      if (body.password) updates.password = body.password;
      if (body.display_name) updates.user_metadata = { display_name: body.display_name };

      if (Object.keys(updates).length) {
        const { error } = await admin.auth.admin.updateUserById(id, updates);
        if (error) {
          console.error("Failed to update auth user:", error);
          return json({ error: error.message, details: error }, 500, origin);
        }
      }

      if (body.role) {
        const { error } = await admin.from("profiles").update({ role: body.role }).eq("id", id);
        if (error) {
          console.error("Failed to update profile role:", error);
          return json({ error: error.message, details: error }, 500, origin);
        }
      }

      console.log("User updated successfully:", id);
      return json({ ok: true }, 200, origin);
    }

    // DELETE "/:id" → ban or hard delete
    if (req.method === "DELETE" && pathname !== "/") {
      const id = pathname.slice(1);
      const hard = url.searchParams.get("hard") === "true";

      if (hard) {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) return json({ error: error.message }, 500, origin);
      } else {
        const { error } = await admin.auth.admin.updateUserById(id, { banned: true });
        if (error) return json({ error: error.message }, 500, origin);
      }
      return json({ ok: true }, 200, origin);
    }

    return json({ error: "Not found" }, 404, origin);
  } catch (e) {
    console.error("Unhandled error in admin-users function:", e);
    return json(
      { error: String(e), stack: e instanceof Error ? e.stack : undefined },
      500,
      req.headers.get("origin")
    );
  }
});
