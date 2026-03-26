import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token || !SUPABASE_ANON_KEY) {
      return json({ error: "Unauthorized" }, 401);
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { clientId, slotLockedUntil } = await req.json();
    if (!clientId) return json({ error: "clientId required" }, 400);

    const { data: client, error: clientError } = await serviceClient
      .from("clients")
      .select("id, agency_id")
      .eq("id", clientId)
      .maybeSingle<{ id: string; agency_id: string }>();

    if (clientError || !client) {
      return json({ error: "Client not found" }, 404);
    }

    const { data: agency } = await serviceClient
      .from("agencies")
      .select("id")
      .eq("id", client.agency_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!agency) {
      return json({ error: "Forbidden" }, 403);
    }

    if (!slotLockedUntil) {
      const { error: deleteError } = await serviceClient.from("clients").delete().eq("id", clientId);
      if (deleteError) return json({ error: deleteError.message }, 500);
      return json({ slotLocked: false });
    }

    const deletedAt = new Date().toISOString();

    const [{ error: postsError }, { error: socialError }, { error: credentialsError }] = await Promise.all([
      serviceClient.from("posts").delete().eq("client_id", clientId),
      serviceClient.from("client_social_accounts").delete().eq("client_id", clientId),
      serviceClient.from("client_credentials").delete().eq("client_id", clientId),
    ]);

    if (postsError) return json({ error: postsError.message }, 500);
    if (socialError) return json({ error: socialError.message }, 500);
    if (credentialsError) return json({ error: credentialsError.message }, 500);

    const { error: updateError } = await serviceClient
      .from("clients")
      .update({
        deleted_at: deletedAt,
        slot_locked_until: slotLockedUntil,
        ai_summary: null,
        pipeline_status: null,
        research_notes: null,
        content_strategy: null,
      })
      .eq("id", clientId);

    if (updateError) return json({ error: updateError.message }, 500);

    return json({ slotLocked: true });
  } catch (error) {
    console.error("delete-client error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
