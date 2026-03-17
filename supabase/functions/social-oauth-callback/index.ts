// social-oauth-callback
// Handles redirect from Meta (Instagram) and LinkedIn after user grants permission.
// Exchanges the auth code for an access token, stores it in client_social_accounts,
// then redirects the user back to the app.
//
// Required Supabase secrets (set via: supabase secrets set KEY=value):
//   META_APP_ID, META_APP_SECRET
//   LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
//   SITE_URL  (e.g. https://yourdomain.com or http://localhost:8080)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_APP_ID         = Deno.env.get("META_APP_ID") ?? "";
const META_APP_SECRET     = Deno.env.get("META_APP_SECRET") ?? "";
const LINKEDIN_CLIENT_ID  = Deno.env.get("LINKEDIN_CLIENT_ID") ?? "";
const LINKEDIN_CLIENT_SECRET = Deno.env.get("LINKEDIN_CLIENT_SECRET") ?? "";
const SITE_URL            = Deno.env.get("SITE_URL") ?? "http://localhost:8080";

// The redirect_uri MUST match exactly what you registered in the developer portal:
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/social-oauth-callback`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function redirect(path: string) {
  return new Response(null, { status: 302, headers: { Location: `${SITE_URL}${path}` } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url    = new URL(req.url);
  const code   = url.searchParams.get("code");
  const state  = url.searchParams.get("state");   // base64 of "platform|clientId|userId"
  const error  = url.searchParams.get("error");

  if (error || !code || !state) {
    return redirect("/?oauth_error=access_denied");
  }

  let platform: string, clientId: string, userId: string;
  try {
    const decoded = atob(state);
    [platform, clientId, userId] = decoded.split("|");
  } catch {
    return redirect("/?oauth_error=invalid_state");
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    if (platform === "Instagram") {
      // ── Meta / Instagram ──────────────────────────────────────────────────────
      // 1. Exchange code for short-lived user token
      const tokenRes = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${code}`
      );
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error(tokenData.error?.message ?? "No token");

      // 2. Exchange for long-lived token (60-day)
      const llRes = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&client_id=${META_APP_ID}` +
        `&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
      );
      const llData = await llRes.json();
      const longToken = llData.access_token ?? tokenData.access_token;

      // 3. Get user's Facebook Pages → find connected Instagram Business Account
      const pagesRes = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${longToken}`
      );
      const pagesData = await pagesRes.json();
      const page = pagesData.data?.[0];
      let igAccountId = null;
      if (page) {
        const igRes = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        );
        const igData = await igRes.json();
        igAccountId = igData.instagram_business_account?.id ?? null;
      }

      // 4. Get Instagram username
      let handle = null;
      if (igAccountId) {
        const meRes = await fetch(
          `https://graph.facebook.com/v18.0/${igAccountId}?fields=username&access_token=${longToken}`
        );
        const meData = await meRes.json();
        handle = meData.username ?? null;
      }

      await supabase.from("client_social_accounts").upsert({
        client_id: clientId,
        platform: "Instagram",
        account_handle: handle,
        account_id: igAccountId,
        access_token: longToken,
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "client_id,platform" });

    } else if (platform === "LinkedIn") {
      // ── LinkedIn ──────────────────────────────────────────────────────────────
      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error(tokenData.error_description ?? "No token");

      // Get LinkedIn profile (author URN)
      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await profileRes.json();
      const linkedinId = profile.sub ?? null;
      const handle = profile.name ?? null;

      await supabase.from("client_social_accounts").upsert({
        client_id: clientId,
        platform: "LinkedIn",
        account_handle: handle,
        account_id: linkedinId,
        access_token: tokenData.access_token,
        token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
      }, { onConflict: "client_id,platform" });

    } else {
      return redirect("/?oauth_error=unsupported_platform");
    }

    return redirect("/?oauth_success=" + encodeURIComponent(platform) + "&client=" + clientId);

  } catch (err: any) {
    console.error("OAuth error:", err);
    return redirect("/?oauth_error=" + encodeURIComponent(err.message ?? "unknown"));
  }
});
