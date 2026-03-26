import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const OPENAI_API_KEY =
  Deno.env.get("OPENAI_API_KEY") ??
  Deno.env.get("VITE_OPENAI_API_KEY") ??
  Deno.env.get("LOVABLE_API_KEY") ??
  "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ClientRow = {
  id: string;
  agency_id: string;
  company_name: string;
  website_url: string | null;
  business_description: string | null;
  industry: string;
  brand_voice: string;
  platforms: string[] | null;
  campaign_goal: string | null;
  target_audience_type: string | null;
  target_age_range: string | null;
  target_description: string | null;
  content_types: string[] | null;
  posting_frequency: string | null;
  pipeline_status: string | null;
  research_notes: string | null;
  content_strategy: string | null;
  ai_summary: string | null;
};

type Draft = {
  pillar: string;
  platform: string;
  caption: string;
  visualPrompt: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSummary(client: ClientRow, researchNotes?: string | null): string {
  const audience = client.target_description || client.target_audience_type || "their audience";
  const ageRange = client.target_age_range ? ` aged ${client.target_age_range}` : "";
  const platformList = client.platforms?.length ? client.platforms.join(", ") : "their social channels";
  const cadence = client.posting_frequency || "a steady cadence";
  const goal = client.campaign_goal?.toLowerCase() || "grow their online presence";
  const snippet = researchNotes
    ? researchNotes
        .split("\n")
        .map((line) => line.replace(/^[^\w]+/, "").trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(" ")
    : "";

  return [
    `${client.company_name} is a ${client.industry || "general business"} business with a ${client.brand_voice?.toLowerCase() || "clear"} brand voice.`,
    client.business_description?.trim() || "They need content that clearly explains their offer and builds trust quickly.",
    `Their priority audience is ${audience}${ageRange}, and they want content that helps them ${goal}.`,
    `The strongest focus right now is ${platformList} with ${cadence}.`,
    snippet || "The brand should lead with clarity, relevance, and consistent messaging across every post.",
  ].join(" ");
}

function mockResearchReport(client: ClientRow): string {
  return `RESEARCH REPORT — ${client.company_name}

Website reviewed: ${client.website_url || "Not provided"}
Industry: ${client.industry}
Brand voice: ${client.brand_voice}

Key findings:
- The brand should lead with clear educational content tied to ${client.campaign_goal || "brand awareness"}.
- The audience responds best to trustworthy proof, simple explanations, and strong point-of-view content.
- ${client.platforms?.join(", ") || "Primary social channels"} should share a consistent message adapted per platform.

Immediate recommendation:
Focus the content on the client's real business strengths, use the website as the source of truth, and build repeatable content pillars from the strongest offers and audience pain points.`;
}

function mockStrategy(client: ClientRow): string {
  return `CONTENT STRATEGY — ${client.company_name}

Pillar 1: Education
- Teach the audience what matters in ${client.industry}

Pillar 2: Proof
- Show examples, wins, and transformation stories

Pillar 3: Conversion
- Turn attention into action with clear offers and next steps

Recommended cadence: ${client.posting_frequency || "3-4 posts per week"} across ${client.platforms?.join(", ") || "the selected channels"}.`;
}

function mockDrafts(client: ClientRow): Draft[] {
  const platforms = client.platforms?.length ? client.platforms : ["Instagram", "LinkedIn", "Twitter"];
  const pillars = ["Education", "Proof", "Offer"];

  return platforms.slice(0, 3).map((platform, index) => ({
    pillar: pillars[index] || "Education",
    platform,
    caption: `Here is a ${platform} draft for ${client.company_name} focused on ${pillars[index] || "Education"}. It reflects the ${client.brand_voice} brand voice and supports ${client.campaign_goal || "brand awareness"}.`,
    visualPrompt: `Create a premium ${platform} visual for ${client.company_name} in the ${client.industry} space with a ${client.brand_voice.toLowerCase()} tone.`,
  }));
}

async function callAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("AI provider is not configured. Add a funded OpenAI key to continue.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 900,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const lower = errorBody.toLowerCase();
    if (
      response.status === 429 ||
      lower.includes("quota") ||
      lower.includes("billing") ||
      lower.includes("insufficient_quota")
    ) {
      throw new Error("OpenAI quota exceeded. Update billing or replace the API key to continue.");
    }
    throw new Error(`AI request failed with status ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned no content");
  return content as string;
}

async function generateResearch(client: ClientRow): Promise<string> {
  return await callAI(
    `You are the Researcher on a social media workforce. Analyze this business and produce practical research notes.

Business: ${client.company_name}
Website: ${client.website_url || "Not provided"}
Industry: ${client.industry}
Brand voice: ${client.brand_voice}
Business description: ${client.business_description || "Not provided"}
Platforms: ${client.platforms?.join(", ") || "Instagram, LinkedIn, Twitter"}
Campaign goal: ${client.campaign_goal || "Brand awareness"}
Target audience: ${client.target_audience_type || "General audience"} ${client.target_age_range || ""}
Target description: ${client.target_description || "Not provided"}

Return concise but specific research notes with:
- what the brand appears to do
- who it serves
- what messaging angles will work
- what content opportunities stand out from the website and profile

Write in a structured note format.`
  );
}

async function generateStrategy(client: ClientRow, research: string): Promise<string> {
  return await callAI(
    `You are the Strategist on a social media workforce. Build a short content strategy for this client.

Business: ${client.company_name}
Industry: ${client.industry}
Brand voice: ${client.brand_voice}
Platforms: ${client.platforms?.join(", ") || "Instagram, LinkedIn, Twitter"}
Campaign goal: ${client.campaign_goal || "Brand awareness"}
Posting frequency: ${client.posting_frequency || "3-4 posts per week"}
Research notes:
${research}

Create 3 content pillars and a short posting recommendation.`
  );
}

async function generateDrafts(client: ClientRow, strategy: string): Promise<Draft[]> {
  const platforms = client.platforms?.length ? client.platforms : ["Instagram", "LinkedIn", "Twitter"];
  const pillars = ["Education", "Proof", "Offer"];

  return await Promise.all(
    platforms.slice(0, 3).map(async (platform, index) => {
      const pillar = pillars[index] || "Education";
      const caption = await callAI(
        `You are the Creative on a social media workforce. Write a ${platform} caption.

Business: ${client.company_name}
Industry: ${client.industry}
Brand voice: ${client.brand_voice}
Campaign goal: ${client.campaign_goal || "Brand awareness"}
Audience: ${client.target_description || client.target_audience_type || "General audience"}
Strategy:
${strategy}

Write one post for the ${pillar} pillar. Include 3-5 hashtags.`
      );

      const visualPrompt = await callAI(
        `Write an image-generation prompt for a ${platform} post for ${client.company_name} in the ${client.industry} industry with a ${client.brand_voice.toLowerCase()} tone.`
      );

      return { pillar, platform, caption, visualPrompt };
    }),
  );
}

async function runPipeline(supabase: ReturnType<typeof createClient>, clientId: string) {
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single<ClientRow>();

  if (clientError || !client) throw clientError ?? new Error("Client not found");

  const shouldSkip =
    Boolean(client.research_notes) ||
    Boolean(client.content_strategy) ||
    ["Drafting", "Pending_Approval", "Scheduled", "Cancelled"].includes(client.pipeline_status ?? "");

  if (shouldSkip) return;

  const { data: currentClient } = await supabase
    .from("clients")
    .select("pipeline_status")
    .eq("id", clientId)
    .single<{ pipeline_status: string | null }>();

  if (currentClient?.pipeline_status === "Cancelled") return;

  await supabase.from("clients").update({ pipeline_status: "Researching" }).eq("id", clientId);

  const research = await generateResearch(client);
  const summary = buildSummary(client, research);

  await supabase
    .from("clients")
    .update({ research_notes: research, ai_summary: summary, pipeline_status: "Drafting" })
    .eq("id", clientId);

  const strategy = await generateStrategy(client, research);
  await supabase.from("clients").update({ content_strategy: strategy }).eq("id", clientId);

  const drafts = await generateDrafts(client, strategy);
  const inserts = drafts.map((draft) => ({
    client_id: clientId,
    caption_text: draft.caption,
    ai_visual_prompt: draft.visualPrompt,
    platform: draft.platform,
    content_pillar: draft.pillar,
    status: "Pending_Approval",
  }));

  await supabase.from("posts").insert(inserts);
  await supabase.from("clients").update({ pipeline_status: "Pending_Approval" }).eq("id", clientId);
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

    const { clientId } = await req.json();
    if (!clientId) return json({ error: "clientId required" }, 400);

    const { data: client, error: clientError } = await serviceClient
      .from("clients")
      .select("id, agency_id, website_url")
      .eq("id", clientId)
      .single<{ id: string; agency_id: string; website_url: string | null }>();

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

    EdgeRuntime.waitUntil(
      runPipeline(serviceClient, clientId).catch(async (error) => {
        console.error("launch-client-pipeline error:", error);
        const message = error instanceof Error ? error.message : "The Workforce could not start.";
        await serviceClient
          .from("clients")
          .update({ research_notes: `Workforce paused: ${message}` })
          .eq("id", clientId);
      }),
    );

    return json({
      accepted: true,
      message: client.website_url
        ? "Workforce started from the saved website and client profile."
        : "Workforce started from the saved client profile.",
    });
  } catch (error) {
    console.error("launch-client-pipeline request error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
