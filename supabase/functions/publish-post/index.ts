// publish-post
// Publishes a post to Instagram or LinkedIn using the client's stored access token.
// Called from the frontend with: { postId: string }
//
// Instagram: Creates media container → publishes (requires image URL on the post)
// LinkedIn:  Creates a text UGC post (text-only supported)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { postId } = await req.json();
    if (!postId) return json({ error: "postId required" }, 400);

    // Fetch post
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .select("id, client_id, caption_text, platform, ai_visual_prompt, status, published_url")
      .eq("id", postId)
      .single();
    if (postErr || !post) return json({ error: "Post not found" }, 404);
    if (post.status === "Published") return json({ error: "Already published" }, 400);

    // Fetch social account token for this platform
    const { data: account } = await supabase
      .from("client_social_accounts")
      .select("access_token, account_id, account_handle")
      .eq("client_id", post.client_id)
      .eq("platform", post.platform)
      .single();

    if (!account?.access_token) {
      return json({ error: `No connected ${post.platform} account. Connect it in the client's Social Accounts tab.` }, 400);
    }

    let publishedUrl: string | null = null;

    // ── Instagram ──────────────────────────────────────────────────────────────
    if (post.platform === "Instagram") {
      if (!account.account_id) {
        return json({ error: "Instagram Business Account ID not found. Re-connect the account." }, 400);
      }
      if (!post.published_url) {
        return json({ error: "Instagram posts require an image URL. Upload an image to this post first." }, 400);
      }

      // Step 1: Create media container
      const containerRes = await fetch(
        `https://graph.facebook.com/v18.0/${account.account_id}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: post.published_url,
            caption: post.caption_text,
            access_token: account.access_token,
          }),
        }
      );
      const container = await containerRes.json();
      if (!container.id) throw new Error(container.error?.message ?? "Failed to create media container");

      // Step 2: Publish the container
      const publishRes = await fetch(
        `https://graph.facebook.com/v18.0/${account.account_id}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: container.id,
            access_token: account.access_token,
          }),
        }
      );
      const publishData = await publishRes.json();
      if (!publishData.id) throw new Error(publishData.error?.message ?? "Failed to publish");

      publishedUrl = `https://www.instagram.com/p/${publishData.id}`;

    // ── LinkedIn ───────────────────────────────────────────────────────────────
    } else if (post.platform === "LinkedIn") {
      if (!account.account_id) {
        return json({ error: "LinkedIn author ID not found. Re-connect the account." }, 400);
      }

      const body: Record<string, unknown> = {
        author: `urn:li:person:${account.account_id}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: post.caption_text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      };

      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "LinkedIn publish failed");

      const ugcId = data.id?.replace("urn:li:ugcPost:", "") ?? "";
      publishedUrl = ugcId ? `https://www.linkedin.com/feed/update/urn:li:ugcPost:${ugcId}` : null;

    } else {
      return json({ error: `Publishing to ${post.platform} is not yet supported.` }, 400);
    }

    // Mark post as Published
    await supabase.from("posts").update({
      status: "Published",
      published_at: new Date().toISOString(),
      published_url: publishedUrl,
    }).eq("id", postId);

    return json({ success: true, publishedUrl });

  } catch (err: unknown) {
    console.error("publish-post error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
