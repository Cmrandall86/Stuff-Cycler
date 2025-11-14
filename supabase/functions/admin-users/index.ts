import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Support both naming conventions for environment variables test
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("ANON_KEY");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE");
const ALLOW_ORIGIN = Deno.env.get("ALLOW_ORIGIN") ?? "http://localhost:5173";

console.log("Edge function starting with env check:", {
  hasUrl: !!SUPABASE_URL,
  hasAnon: !!ANON_KEY,
  hasService: !!SERVICE_ROLE,
});
function cors(headers = {}) {
  return {
    "content-type": "application/json",
    "access-control-allow-origin": ALLOW_ORIGIN,
    "access-control-allow-headers": "authorization, content-type, apikey, x-client-info",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-credentials": "true",
    "access-control-max-age": "86400",
    ...headers
  };
}
const json = (data, status = 200)=>new Response(JSON.stringify(data), {
    status,
    headers: cors()
  });
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors()
  });
  try {
    const url = new URL(req.url);
    let pathname = url.pathname;
    if (pathname.startsWith("/functions/v1/admin-users")) {
      pathname = pathname.replace("/functions/v1/admin-users", "") || "/";
    } else if (pathname.startsWith("/admin-users")) {
      pathname = pathname.replace("/admin-users", "") || "/";
    }
    const authHeader = req.headers.get("Authorization") || "";
    const requester = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader
        }
      },
      auth: {
        persistSession: false
      }
    });
    const { data: me, error: meErr } = await requester.auth.getUser();
    if (meErr || !me?.user) return json({
      error: "Unauthorized"
    }, 401);
    // ---- role check (RPC first, then fallbacks) ----
    let role = null;
    const { data: rpcRole, error: rpcErr } = await requester.rpc("get_my_role");
    if (!rpcErr && rpcRole) {
      role = rpcRole;
    } else {
      const { data: prof, error: profErr } = await requester.from("profiles").select("role").eq("id", me.user.id).single();
      if (!profErr && prof?.role) {
        role = prof.role;
      } else {
        const adminCheck = createClient(SUPABASE_URL, SERVICE_ROLE, {
          auth: {
            persistSession: false
          }
        });
        const { data: prof2, error: profErr2 } = await adminCheck.from("profiles").select("role").eq("id", me.user.id).single();
        if (!profErr2 && prof2?.role) role = prof2.role;
      }
    }
    if (role !== "admin") {
      return json({
        error: "Forbidden",
        details: `role=${role ?? "null"}`
      }, 403);
    }
    // ---- admin actions (service role) ----
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'admin-users-function'
        }
      }
    });
    if (req.method === "GET" && pathname === "/") {
      const q = url.searchParams.get("query") ?? "";
      const page = Number(url.searchParams.get("page") ?? "1");
      const size = Number(url.searchParams.get("perPage") ?? "20");
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: size
      });
      if (error) return json({
        error: error.message
      }, 500);
      const ids = data.users.map((u)=>u.id);
      const { data: profs, error: profsErr } = await admin.from("profiles").select("id, role").in("id", ids);
      if (profsErr) return json({
        error: profsErr.message
      }, 500);
      const roleMap = new Map((profs ?? []).map((p)=>[
          p.id,
          p.role
        ]));
      const enriched = data.users.map((u)=>({
          ...u,
          role: roleMap.get(u.id) || "member"
        }));
      const filtered = q ? enriched.filter((u)=>(u.email || "").toLowerCase().includes(q.toLowerCase()) || (u.user_metadata?.display_name || "").toLowerCase().includes(q.toLowerCase())) : enriched;
      return json({
        users: filtered,
        page,
        size,
        total: data.users.length
      });
    }
    if (req.method === "POST" && pathname === "/") {
      const { email, password, display_name, role } = await req.json();
      console.log("Creating user:", { email, display_name, role });
      
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name
        }
      });
      
      if (error) {
        console.error("Failed to create auth user:", error);
        return json({
          error: error.message,
          details: error
        }, 500);
      }
      
      const uid = data.user.id;
      console.log("Auth user created, upserting profile for:", uid);
      
      const { error: upErr } = await admin.from("profiles").upsert({
        id: uid,
        display_name,
        role: role === "admin" ? "admin" : "member"
      });
      
      if (upErr) {
        console.error("Failed to upsert profile:", upErr);
        return json({
          error: upErr.message,
          details: upErr
        }, 500);
      }
      
      console.log("User created successfully:", uid);
      return json({
        id: uid
      }, 201);
    }
    if (req.method === "PATCH" && pathname !== "/") {
      const id = pathname.slice(1);
      const body = await req.json();
      console.log("Updating user:", { id, body });
      
      // Prevent self-demotion
      if (body.role && body.role !== "admin" && id === me.user.id) {
        console.warn("Self-demotion attempt blocked for:", id);
        return json({
          error: "Cannot remove your own admin privileges"
        }, 400);
      }
      
      const updates = {};
      if (body.password) updates.password = body.password;
      if (body.display_name) updates.user_metadata = {
        display_name: body.display_name
      };
      
      if (Object.keys(updates).length) {
        const { error } = await admin.auth.admin.updateUserById(id, updates);
        if (error) {
          console.error("Failed to update auth user:", error);
          return json({
            error: error.message,
            details: error
          }, 500);
        }
      }
      
      if (body.role) {
        const { error } = await admin.from("profiles").update({
          role: body.role
        }).eq("id", id);
        if (error) {
          console.error("Failed to update profile role:", error);
          return json({
            error: error.message,
            details: error
          }, 500);
        }
      }
      
      console.log("User updated successfully:", id);
      return json({
        ok: true
      });
    }
    if (req.method === "DELETE" && pathname !== "/") {
      const id = pathname.slice(1);
      const hard = url.searchParams.get("hard") === "true";
      if (hard) {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) return json({
          error: error.message
        }, 500);
      } else {
        const { error } = await admin.auth.admin.updateUserById(id, {
          banned: true
        });
        if (error) return json({
          error: error.message
        }, 500);
      }
      return json({
        ok: true
      });
    }
    return json({
      error: "Not found"
    }, 404);
  } catch (e) {
    console.error("Unhandled error in admin-users function:", e);
    return json({
      error: String(e),
      stack: e instanceof Error ? e.stack : undefined
    }, 500);
  }
});
