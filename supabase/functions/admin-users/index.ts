// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    },
  });
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") return json({}, 200);

    const url = new URL(req.url);
    const path = url.pathname;
    const authHeader = req.headers.get("Authorization") || "";

    // Requester client (uses user's JWT)
    const requester = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: me } = await requester.auth.getUser();
    if (!me?.user) return json({ error: "Unauthorized" }, 401);

    // Check if requester is admin
    const { data: prof, error: profErr } = await requester
      .from("profiles")
      .select("role")
      .eq("id", me.user.id)
      .single();

    if (profErr || prof?.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    // Admin client (service role)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // GET /admin-users - List users
    if (req.method === "GET" && path === "/admin-users") {
      const q = url.searchParams.get("query") ?? "";
      const page = Number(url.searchParams.get("page") ?? "1");
      const size = 20;

      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: size,
      });

      if (error) throw error;

      // Get roles from profiles
      const userIds = data.users.map((u) => u.id);
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, role")
        .in("id", userIds);

      const roleMap = new Map(
        profiles?.map((p) => [p.id, p.role]) || []
      );

      // Enrich users with role from profiles
      const enrichedUsers = data.users.map((u) => ({
        ...u,
        role: roleMap.get(u.id) || "member",
      }));

      // Filter in memory (search filters after pagination)
      const filtered = q
        ? enrichedUsers.filter(
            (u) =>
              (u.email || "").toLowerCase().includes(q.toLowerCase()) ||
              (u.user_metadata?.display_name || "")
                .toLowerCase()
                .includes(q.toLowerCase())
          )
        : enrichedUsers;

      return json({ users: filtered, page, size, total: data.users.length });
    }

    // POST /admin-users - Create user
    if (req.method === "POST" && path === "/admin-users") {
      const body = await req.json();
      const { email, password, display_name, role } = body;

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });

      if (error) throw error;

      const uid = data.user?.id!;

      // Upsert profile + role
      const { error: upErr } = await admin
        .from("profiles")
        .upsert({
          id: uid,
          display_name,
          role: role === "admin" ? "admin" : "member",
        });

      if (upErr) throw upErr;

      return json({ id: uid });
    }

    // PATCH /admin-users/:id - Update user
    if (req.method === "PATCH" && path.startsWith("/admin-users/")) {
      const id = path.split("/").pop()!;
      const body = await req.json();

      const updates: any = {};
      if (body.password) updates.password = body.password;
      if (body.display_name) {
        updates.user_metadata = { display_name: body.display_name };
      }

      if (Object.keys(updates).length) {
        const { error } = await admin.auth.admin.updateUserById(id, updates);
        if (error) throw error;
      }

      if (body.role) {
        const { error } = await admin
          .from("profiles")
          .update({ role: body.role })
          .eq("id", id);
        if (error) throw error;
      }

      return json({ ok: true });
    }

    // DELETE /admin-users/:id - Disable or delete user
    if (req.method === "DELETE" && path.startsWith("/admin-users/")) {
      const id = path.split("/").pop()!;
      const hard = url.searchParams.get("hard") === "true";

      if (hard) {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) throw error;
      } else {
        const { error } = await admin.auth.admin.updateUserById(id, {
          banned: true,
        });
        if (error) throw error;
      }

      return json({ ok: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

