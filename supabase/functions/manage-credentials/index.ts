import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const encryptionKey = Deno.env.get("ENCRYPTION_KEY") || "default-dev-key";

const supabase = createClient(supabaseUrl, supabaseKey);

interface CredentialRequest {
  client_id: string;
  action: "add" | "update" | "delete" | "list";
  platform?: string;
  key_name?: string;
  credential_type?: string;
  value?: string;
  credential_id?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { client_id, action, platform, key_name, credential_type, value, credential_id } = await req.json() as CredentialRequest;

    // Verify user is agency owner of this client
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: clientData } = await supabase
      .from("clients")
      .select("agency_id")
      .eq("id", client_id)
      .single();

    if (!clientData) return new Response(JSON.stringify({ error: "Client not found" }), { status: 404 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (profile?.agency_id !== clientData.agency_id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    if (action === "add" && platform && key_name && credential_type && value) {
      const { data, error } = await supabase.rpc("add_encrypted_credential", {
        p_client_id: client_id,
        p_platform: platform,
        p_key_name: key_name,
        p_credential_type: credential_type,
        p_value: value,
        p_encryption_key: encryptionKey,
      });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    if (action === "update" && credential_id && value) {
      const { data, error } = await supabase.rpc("update_encrypted_credential", {
        p_credential_id: credential_id,
        p_value: value,
        p_encryption_key: encryptionKey,
      });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    if (action === "delete" && credential_id) {
      const { error } = await supabase
        .from("client_credentials")
        .delete()
        .eq("id", credential_id);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("client_credentials")
        .select("id, platform, key_name, credential_type, created_at")
        .eq("client_id", client_id);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
