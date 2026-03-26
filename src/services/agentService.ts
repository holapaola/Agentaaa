import { supabase } from '@/integrations/supabase/client';
import type { AppClient } from '@/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Mock Response Generators ─────────────────────────────────────────────────
// SWAP: replace each mock call with callOpenAI(prompt) when VITE_OPENAI_API_KEY is set

function mockResearchReport(companyName: string, industry: string, brandVoice: string): string {
  return `🔬 RESEARCH REPORT — ${companyName}
Industry: ${industry} | Brand Voice: ${brandVoice}

TOP TRENDS DETECTED:
• Content series generating 3–5× above-average engagement in ${industry}
• Behind-the-scenes storytelling converting at 6.8% (industry avg: 1.9%)
• Short-form video (Reels/Shorts) trending +180% this quarter

COMPETITOR WINS:
• Top ${industry} brands averaging 12K–45K engagements on transformation posts
• "Proof-based" content (results, testimonials) driving highest CTR at 8.2%

AUDIENCE PAIN POINTS:
• Decision fatigue: customers overwhelmed by choices — clarity and simplicity win
• Trust deficit: 73% of buyers research 3+ sources before committing

OPPORTUNITY IDENTIFIED:
Lead with education and authority. Convert with social proof. Close with a
low-friction, no-risk offer. The "${brandVoice}" voice is a strong differentiator
in ${industry} — lean into it from the first sentence.`;
}

function mockContentStrategy(companyName: string, industry: string, brandVoice: string): string {
  return `📋 CONTENT STRATEGY — ${companyName}
3 Pillars for the Next 7 Days

PILLAR 1 — Educational (Instagram)
Goal: Position ${companyName} as the go-to authority in ${industry}
Hook: "Most people in ${industry} get this wrong — here's what actually works…"
Format: Carousel or Reel with 3–5 actionable tips
Voice: ${brandVoice}

PILLAR 2 — Social Proof (LinkedIn)
Goal: Build trust with real results and customer stories
Hook: "Here's what happened when [Client Name] tried our approach for 6 weeks…"
Format: Story-driven long-form post with a clear before/after outcome
Voice: ${brandVoice}

PILLAR 3 — Direct Offer (Twitter/X)
Goal: Drive low-friction conversions with a punchy CTA
Hook: "Your first week with ${companyName} is on us. No credit card needed."
Format: Short, punchy text post with a single link
Voice: ${brandVoice}

SCHEDULING RECOMMENDATION:
Post Pillar 1 (Tue), Pillar 2 (Thu), Pillar 3 (Sun) for maximum weekly reach.`;
}

interface PostDraft {
  pillar: string;
  platform: string;
  caption: string;
  visualPrompt: string;
}

function buildClientSummary(client: AppClient, researchNotes?: string | null): string {
  const companyName = client.company_name;
  const industry = client.industry || "general business";
  const brandVoice = client.brand_voice || "clear";
  const businessDescription = client.business_description?.trim();
  const audience = client.target_description || client.target_audience_type || "their audience";
  const ageRange = client.target_age_range ? ` aged ${client.target_age_range}` : "";
  const platformList = client.platforms?.length ? client.platforms.join(", ") : "their social channels";
  const postingCadence = client.posting_frequency || "a steady cadence";
  const goal = client.campaign_goal?.toLowerCase() || "grow their online presence";
  const researchSnippet = researchNotes
    ? researchNotes
        .split("\n")
        .map((line) => line.replace(/^[^\w]+/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, 2)
        .join(" ")
    : "";

  return [
    `${companyName} is a ${industry} business with a ${brandVoice.toLowerCase()} brand voice.`,
    businessDescription || "They need content that clearly explains their offer and builds trust quickly.",
    `Their priority audience is ${audience}${ageRange}, and they want content that helps them ${goal}.`,
    `The strongest focus right now is ${platformList} with ${postingCadence}.`,
    researchSnippet || "The brand should lead with clarity, relevance, and consistent messaging across every post.",
  ].join(" ");
}

function mockPostDrafts(companyName: string, industry: string, brandVoice: string): PostDraft[] {
  const voiceTone: Record<string, string> = {
    Professional: 'authoritative and polished',
    Witty: 'clever and humorous',
    Energetic: 'bold and high-energy',
    Minimalist: 'clean and understated',
  };
  const tone = voiceTone[brandVoice] || 'engaging and compelling';
  const tag = companyName.replace(/\s/g, '');
  const industryTag = industry.replace(/[\s/]/g, '');

  return [
    {
      pillar: 'Educational',
      platform: 'Instagram',
      caption: `💡 Most people in ${industry} overlook this — and it's quietly costing them results.\n\nAt ${companyName}, we've seen how one small shift transforms outcomes.\n\nHere are 3 things that actually move the needle:\n1️⃣ Focus on [Key Insight One]\n2️⃣ Stop ignoring [Key Insight Two]\n3️⃣ Double down on [Key Insight Three]\n\nSave this. You'll want to come back to it. 👇\n\n#${industryTag} #ExpertTips #${tag}`,
      visualPrompt: `A ${tone} editorial image representing expertise in ${industry}. Dark background with warm gold accent lighting. Clean typography overlay: "The ${industry} Secret". High-end magazine composition. No clutter. Brand colors: deep navy and gold.`,
    },
    {
      pillar: 'Social Proof',
      platform: 'LinkedIn',
      caption: `"I was skeptical — but ${companyName} completely changed our approach to ${industry}."\n\n[Client Name] came to us struggling with [core problem]. Six weeks later:\n\n✅ [Result One — specific and measurable]\n✅ [Result Two — specific and measurable]\n✅ [Result Three — specific and measurable]\n\nThis is exactly why we do what we do.\n\nIf you're facing the same challenges in ${industry}, let's have a conversation. Link in bio.\n\n#ClientSuccess #${industryTag} #Results #${tag}`,
      visualPrompt: `A warm, authentic testimonial graphic for ${companyName}. Professional dark-mode card design with a bold quote callout, subtle gold border, and a blurred lifestyle background representing success in ${industry}. Clean sans-serif typography. Trustworthy and premium feel.`,
    },
    {
      pillar: 'Direct Offer',
      platform: 'Twitter',
      caption: `Your first week with ${companyName} is completely on us. 🎯\n\nNo credit card. No commitment. Just results.\n\nWe're so confident in what we deliver in ${industry} that we'll prove it before you pay a single cent.\n\n👉 Claim your free week → [link]\n\n(This offer closes Sunday.)`,
      visualPrompt: `A ${tone} promotional graphic for ${companyName}. Bold headline "FREE FIRST WEEK" on a dark background. Gold call-to-action visual. Urgency-driven, direct design. Zero clutter — one message, one action.`,
    },
  ];
}

// ── Perplexity (live web research) ───────────────────────────────────────────
// model: 'sonar-pro' = live web search (Agent 1), 'sonar-pro' + system = creative writing (Agents 2 & 3)
async function callPerplexity(prompt: string, systemMessage?: string): Promise<{ content: string; citations: string[] }> {
  if (!import.meta.env.VITE_PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: 1200,
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message ?? JSON.stringify(data.error));
    return {
      content: data.choices[0].message.content as string,
      citations: (data.citations ?? []) as string[],
    };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('Perplexity request timed out. Please try again.');
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

// ── OpenAI ────────────────────────────────────────────────────────────────────
async function callOpenAI(prompt: string): Promise<string> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content as string;
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('AI request timed out. Please try again.');
    const message = e instanceof Error ? e.message.toLowerCase() : '';
    if (
      message.includes('quota') ||
      message.includes('billing') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('insufficient_quota')
    ) {
      throw new Error('OpenAI quota exceeded. Update billing or replace the API key to continue.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

// ── callAI — OpenAI for Agents 2 & 3, falls back to Perplexity sonar-pro ─────
async function callAI(prompt: string): Promise<string> {
  try {
    return await callOpenAI(prompt);
  } catch (e) {
    const msg = (e as Error).message.toLowerCase();
    const isQuota = msg.includes('quota') || msg.includes('billing') || msg.includes('429') || msg.includes('not configured');
    if (isQuota && import.meta.env.VITE_PERPLEXITY_API_KEY) {
      // Use sonar-pro with a system message that stops it from doing web searches
      const { content } = await callPerplexity(prompt, 'Do NOT search the internet. You are a creative content writer and strategist. Generate your response based ONLY on the information provided in the user message. Do not reference any external sources or citations.');
      return content;
    }
    throw e;
  }
}
const USE_MOCK = false;

// ── Cancel check — stops chain if user cancelled ─────────────────────────────
async function isCancelled(clientId: string): Promise<boolean> {
  const { data } = await supabase
    .from('clients')
    .select('pipeline_status')
    .eq('id', clientId)
    .single();
  return data?.pipeline_status === 'Cancelled';
}

export async function cancelPipeline(clientId: string): Promise<void> {
  await supabase
    .from('clients')
    .update({ pipeline_status: 'Cancelled' })
    .eq('id', clientId);
}

async function shouldSkipPipelineLaunch(clientId: string): Promise<boolean> {
  const { data: client, error } = await supabase
    .from('clients')
    .select('pipeline_status, research_notes, content_strategy')
    .eq('id', clientId)
    .single();

  if (error) throw error;
  if (!client) throw new Error('Client not found');

  return (
    Boolean(client.research_notes) ||
    Boolean(client.content_strategy) ||
    ['Drafting', 'Pending_Approval', 'Scheduled', 'Cancelled'].includes(client.pipeline_status ?? '')
  );
}

async function launchClientPipelineFallback(clientId: string): Promise<void> {
  if (await shouldSkipPipelineLaunch(clientId)) return;
  try {
    await runResearcher(clientId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The Workforce could not start.';
    await supabase
      .from('clients')
      .update({ research_notes: `Workforce paused: ${message}` })
      .eq('id', clientId);
    throw error;
  }
}

export async function launchClientPipeline(clientId: string): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('launch-client-pipeline', {
      body: { clientId },
    });

    if (error) throw error;
  } catch (error) {
    console.warn('Edge pipeline launch unavailable, falling back to client-side launch:', error);
    await launchClientPipelineFallback(clientId);
  }
}

// ── Re-run Pipeline ───────────────────────────────────────────────────────────
// Clears all previous results then runs the full pipeline fresh
export async function rerunClientPipeline(clientId: string): Promise<void> {
  // 1. Delete pending/unapproved posts so they don't stack up
  await supabase
    .from('posts')
    .delete()
    .eq('client_id', clientId)
    .in('status', ['Pending_Approval', 'Draft']);

  // 2. Reset client data so shouldSkipPipelineLaunch won't block it
  await supabase.from('clients').update({
    pipeline_status: 'Researching',
    research_notes: null,
    content_strategy: null,
    ai_summary: null,
    brand_primary_color: null,
    brand_secondary_color: null,
    brand_accent_color: null,
    brand_visual_style: null,
    brand_personality_tags: null,
    brand_notes: null,
  }).eq('id', clientId);

  // 3. Run the full pipeline
  await runResearcher(clientId);
}

// ── Agent 1: Researcher ───────────────────────────────────────────────────────
export async function runResearcher(clientId: string): Promise<void> {
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  if (error || !client) throw new Error('Client not found');
  if (await isCancelled(clientId)) return;

  await supabase
    .from('clients')
    .update({ pipeline_status: 'Researching' })
    .eq('id', clientId);

  // Research: Perplexity (live web) → OpenAI (trained knowledge) → mock
  let research: string;
  if (USE_MOCK) {
    await delay(2500);
    research = mockResearchReport(client.company_name, client.industry, client.brand_voice);
  } else if (import.meta.env.VITE_PERPLEXITY_API_KEY) {
    const platforms = (client.platforms as string[])?.join(', ') || 'Instagram, TikTok, Facebook';
    const industries = client.industry || 'Creative & Media';
    const perplexityPrompt = `You are a senior social media strategist doing live market research in ${new Date().getFullYear()}.

IMPORTANT RULES:
- Write ONLY the report sections below. Do NOT include any intro, disclaimers, limitation notes, or meta-commentary.
- If you cannot find specific data, provide the closest available real-world example. Never explain what you cannot do.
- Use real stats, real creator names, and real platform data wherever possible.

Client: ${client.company_name}
What they do: ${client.business_description || industries}
Sectors: ${industries}
Platforms: ${platforms}
Goal: ${client.campaign_goal || 'Brand Awareness'}
Audience: ${client.target_description || client.target_audience_type || 'General audience'}, aged ${client.target_age_range || 'All Ages'}
Voice: ${client.brand_voice}

Search for:
- "${platforms} top creators ${industries} content strategy ${new Date().getFullYear()}"
- "best performing ${platforms} content formats animation music gaming fashion ${new Date().getFullYear()}"
- "indie creator brand growth ${platforms} ${new Date().getFullYear()} engagement stats"

Write ONLY these four sections, nothing else:

🔬 TOP TRENDS — 3 bullets on what content formats and styles are performing best RIGHT NOW on ${platforms} for ${industries} creators. Include real engagement stats or growth percentages.

🏆 COMPETITOR WINS — 2 bullets naming real creators or brands in animation, music, gaming, fashion, or indie creative spaces that are growing fast on ${platforms} right now. What specific content is working for them? If exact competitors aren't available, name the closest real-world creators doing similar work.

😤 AUDIENCE PAIN POINTS — 2 bullets on what ${client.target_description || 'young creative audiences'} want more of on social media and what frustrates them about current content.

💡 OPPORTUNITY — One specific content format or angle that ${client.company_name} can own on ${platforms} to grow brand awareness fast, based on current gaps in the market.`;

    const { content, citations } = await callPerplexity(perplexityPrompt);
    research = content;
    if (citations.length > 0) {
      research += `\n\n📚 SOURCES\n${citations.map((url, i) => `[${i + 1}] ${url}`).join('\n')}`;
    }
  } else {
    research = await callOpenAI(
      `You are a social media research analyst. Research this business and write a structured report.
Business: ${client.company_name} | Industry: ${client.industry} | Brand Voice: ${client.brand_voice}
${client.website_url ? `Website: ${client.website_url}` : ''}
${client.business_description ? `Description: ${client.business_description}` : ''}
Platforms: ${(client.platforms as string[])?.join(', ') || 'Instagram, LinkedIn, Twitter'}
Campaign Goal: ${client.campaign_goal || 'Brand Awareness'}
Target Audience: ${client.target_audience_type || 'B2C'} · ${client.target_age_range || 'All Ages'}
${client.target_description ? `Ideal Customer: ${client.target_description}` : ''}
Preferred Content Types: ${(client.content_types as string[])?.join(', ') || 'Educational, Promotional'}
Posting Frequency: ${client.posting_frequency || '3-4x per week'}

Return a report with:
🔬 TOP TRENDS in ${client.industry} targeting ${client.target_age_range || 'this audience'} right now (3 bullets)
🏆 COMPETITOR WINS — what's working for top ${client.industry} brands on ${(client.platforms as string[])?.join(' & ')} (2 bullets)
😤 AUDIENCE PAIN POINTS for ${client.target_audience_type || 'consumers'} in this space (2 bullets)
💡 OPPORTUNITY for ${client.company_name} — specific to their goal: ${client.campaign_goal} and content types: ${(client.content_types as string[])?.join(', ')}

Be specific, data-driven, and actionable.`
    );
  }

  const summary = buildClientSummary(client as AppClient, research);

  await supabase
    .from('clients')
    .update({ research_notes: research, ai_summary: summary, pipeline_status: 'Drafting' })
    .eq('id', clientId);

  // Extract structured brand identity from website (non-fatal if it fails)
  if (client.website_url) {
    await parseBrandIdentity(clientId, research, client.website_url);
  }

  await runStrategist(clientId);
}

// ── Brand Identity Extractor ──────────────────────────────────────────────────
// Searches for brand identity by looking up the website directly via Perplexity
async function parseBrandIdentity(clientId: string, _researchText: string, websiteUrl: string): Promise<void> {
  try {
    const searchPrompt = `Search for the website ${websiteUrl} and describe its visual brand identity.

Return ONLY valid JSON (no other text, no markdown):
{
  "primaryColor": "best hex guess for dominant brand color, e.g. #FF5500",
  "secondaryColor": "hex guess for second color",
  "accentColor": "hex guess for accent/highlight color",
  "visualStyle": "one of: Bold & Colorful, Minimalist, Funky & Eclectic, Dark & Premium, Clean & Modern, Vintage & Retro, Playful & Fun, Natural & Earthy",
  "personalityTags": ["3 to 5 words from: Playful, Edgy, Warm, Luxurious, Rebellious, Creative, Professional, Fun, Trendy, Authentic, Bold, Chill, Vibrant, Elegant, Raw"],
  "brandNotes": "1-2 sentences describing the brand's visual identity and aesthetic based on what you find"
}`;

    const { content } = await callPerplexity(searchPrompt);
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return;

    const brand = JSON.parse(jsonMatch[0]);
    await supabase.from('clients').update({
      brand_primary_color: brand.primaryColor || null,
      brand_secondary_color: brand.secondaryColor || null,
      brand_accent_color: brand.accentColor || null,
      brand_visual_style: brand.visualStyle || null,
      brand_personality_tags: Array.isArray(brand.personalityTags) ? brand.personalityTags : null,
      brand_notes: brand.brandNotes || null,
    }).eq('id', clientId);
  } catch (err) {
    console.warn('Brand identity extraction skipped:', err);
  }
}

// ── Agent 2: Strategist ───────────────────────────────────────────────────────
export async function runStrategist(clientId: string): Promise<void> {
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  if (!client) throw new Error('Client not found');
  if (await isCancelled(clientId)) return;

  // Use real OpenAI if key present, otherwise mock
  let strategy: string;
  if (USE_MOCK) {
    await delay(2500);
    strategy = mockContentStrategy(client.company_name, client.industry, client.brand_voice);
  } else {
    strategy = await callAI(
      `You are a social media strategist. Create a content strategy for this business.
Business: ${client.company_name} | Industry: ${client.industry} | Brand Voice: ${client.brand_voice}
Platforms: ${(client.platforms as string[])?.join(', ') || 'Instagram, LinkedIn, Twitter'}
Campaign Goal: ${client.campaign_goal || 'Brand Awareness'}
Target Audience: ${client.target_audience_type || 'B2C'} · ${client.target_age_range || 'All Ages'}
${client.target_description ? `Ideal Customer: ${client.target_description}` : ''}
Preferred Content Types: ${(client.content_types as string[])?.join(', ') || 'Educational, Promotional'}
Posting Frequency: ${client.posting_frequency || '3-4x per week'}
Research: ${client.research_notes ?? 'N/A'}

Create one content pillar per platform they use. For each pillar:
- Platform name
- Goal alignment (how it serves: ${client.campaign_goal})
- Hook idea tailored to ${client.target_age_range || 'their audience'}
- Post format (Reel, Carousel, Story, etc.) matching ${(client.content_types as string[])?.join(' / ')}
- Tone (${client.brand_voice})

End with a posting schedule: ${client.posting_frequency || '3-4x per week'} across their platforms.`
    );
  }

  await supabase
    .from('clients')
    .update({ content_strategy: strategy })
    .eq('id', clientId);

  await runCreative(clientId);
}

// ── Agent 3: Creative ─────────────────────────────────────────────────────────
export async function runCreative(clientId: string): Promise<void> {
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  if (!client) throw new Error('Client not found');
  if (await isCancelled(clientId)) return;

  // Use real OpenAI if key present, otherwise mock
  let drafts: PostDraft[];
  if (USE_MOCK) {
    await delay(2500);
    drafts = mockPostDrafts(client.company_name, client.industry, client.brand_voice);
  } else {
    // Use client's chosen platforms, fall back to defaults
    const chosenPlatforms: string[] = (client.platforms as string[])?.length
      ? (client.platforms as string[])
      : ['Instagram', 'LinkedIn', 'Twitter'];

    const pillarNames = ['Educational', 'Social Proof', 'Direct Offer'];
    const platformPillars = chosenPlatforms.map((platform, i) => ({
      platform,
      pillar: pillarNames[i % pillarNames.length],
    }));

    drafts = await Promise.all(
      platformPillars.map(async ({ pillar, platform }) => {
        const caption = await callAI(
          `Write a ${platform} post for ${client.company_name} (${client.industry}).
Brand voice: ${client.brand_voice}. Content pillar: ${pillar}. Campaign goal: ${client.campaign_goal ?? 'Brand Awareness'}.
Target audience: ${client.target_audience_type || 'B2C'}, ${client.target_age_range || 'All Ages'}.
${client.target_description ? `Ideal customer: ${client.target_description}` : ''}
${client.business_description ? `About the business: ${client.business_description}` : ''}
Strategy: ${client.content_strategy ?? ''}

Write ONLY the caption. Include emojis and 3-5 hashtags.
Platform tone: ${platform === 'Instagram' ? 'visual + engaging' : platform === 'LinkedIn' ? 'professional story' : platform === 'TikTok' ? 'fun + trend-aware' : platform === 'Facebook' ? 'community-friendly' : 'punchy + direct'}.
Speak directly to: ${client.target_description || `${client.target_audience_type || 'your audience'} aged ${client.target_age_range || 'all ages'}`}.`
        );
        const visualPrompt = await callAI(
          `Describe an AI image generation prompt for a ${platform} post for ${client.company_name}.
Industry: ${client.industry}. Tone: ${client.brand_voice}. Pillar: ${pillar}.
${client.brand_primary_color ? `Brand colors: ${client.brand_primary_color} (primary)${client.brand_secondary_color ? `, ${client.brand_secondary_color} (secondary)` : ''}${client.brand_accent_color ? `, ${client.brand_accent_color} (accent)` : ''}.` : ''}
${client.brand_visual_style ? `Visual style: ${client.brand_visual_style}.` : ''}
${(client.brand_personality_tags as string[])?.length ? `Brand personality: ${(client.brand_personality_tags as string[]).join(', ')}.` : ''}
${client.brand_notes ? `Brand aesthetic: ${client.brand_notes}` : ''}
Use the brand's actual colors and visual style throughout the image. Output only the image prompt. Make it vivid, specific, and genuinely brand-aligned.`
        );
        return { pillar, platform, caption, visualPrompt };
      })
    );
  }

  const inserts = drafts.map((d) => ({
    client_id: clientId,
    caption_text: d.caption,
    ai_visual_prompt: d.visualPrompt,
    platform: d.platform,
    content_pillar: d.pillar,
    status: 'Pending_Approval',
  }));

  await supabase.from('posts').insert(inserts);
  await supabase
    .from('clients')
    .update({ pipeline_status: 'Pending_Approval' })
    .eq('id', clientId);
}

// ── Agent 4: Butler (called per-post on approval) ─────────────────────────────
export async function runButler(postId: string, scheduledAt?: Date): Promise<void> {
  const scheduled = scheduledAt ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(10, 0, 0, 0);
    return d;
  })();

  await supabase
    .from('posts')
    .update({ status: 'Scheduled', scheduled_at: scheduled.toISOString() })
    .eq('id', postId);

  const { data: post } = await supabase
    .from('posts')
    .select('client_id')
    .eq('id', postId)
    .single();
  if (!post) return;

  const { data: remaining } = await supabase
    .from('posts')
    .select('status')
    .eq('client_id', post.client_id);

  const allDone = remaining?.every(
    (p) => p.status === 'Scheduled' || p.status === 'Approved'
  );
  if (allDone) {
    await supabase
      .from('clients')
      .update({ pipeline_status: 'Scheduled' })
      .eq('id', post.client_id);
  }
}

// ── Regenerate a single post with optional feedback ───────────────────────────
export async function regeneratePost(postId: string, _feedback?: string): Promise<void> {
  const { data: post } = await supabase
    .from('posts')
    .select('*, clients(company_name, industry, brand_voice)')
    .eq('id', postId)
    .single();
  if (!post) throw new Error('Post not found');

  const client = post.clients as { company_name: string; industry: string; brand_voice: string };

  // Use real OpenAI if key present, otherwise mock
  let caption: string;
  let visualPrompt: string;
  if (USE_MOCK) {
    await delay(1500);
    const mockDrafts = mockPostDrafts(client.company_name, client.industry, client.brand_voice);
    const match = mockDrafts.find((d) => d.pillar === post.content_pillar) ?? mockDrafts[0];
    caption = match.caption;
    visualPrompt = match.visualPrompt;
  } else {
    const feedbackNote = _feedback ? `\nUser feedback: ${_feedback}` : '';
    caption = await callAI(
      `Rewrite this ${post.platform} post for ${client.company_name} (${client.industry}).
Brand voice: ${client.brand_voice}. Content pillar: ${post.content_pillar}.${feedbackNote}
Write ONLY the new caption with emojis and hashtags. Make it distinctly different from before.`
    );
    visualPrompt = await callAI(
      `Write a new AI image generation prompt for ${client.company_name} on ${post.platform}.
Industry: ${client.industry}. Tone: ${client.brand_voice}. Pillar: ${post.content_pillar}.${feedbackNote}
Output only the image prompt.`
    );
  }

  await supabase
    .from('posts')
    .update({
      caption_text: caption,
      ai_visual_prompt: visualPrompt,
      status: 'Pending_Approval',
    })
    .eq('id', postId);
}

// ── Content Studio Task Runner ────────────────────────────────────────────────
interface ContentTaskInput {
  client: AppClient;
  task: string;
  platforms: string[];
  format: 'short' | 'long';
  mediaUrl?: string | null;
  linkUrl?: string | null;
}

interface ContentTaskResult {
  platform: string;
  caption: string;
  visualPrompt: string;
}

export async function runContentTask({
  client,
  task,
  platforms,
  format,
  mediaUrl,
  linkUrl,
}: ContentTaskInput): Promise<ContentTaskResult[]> {
  const company = client.company_name as string;
  const industry = client.industry as string;
  const voice = client.brand_voice as string;
  const goal = (client.campaign_goal as string) || 'Brand Awareness';
  const audienceType = (client.target_audience_type as string) || 'B2C';
  const ageRange = (client.target_age_range as string) || 'All Ages';
  const targetDesc = (client.target_description as string) || '';
  const contentTypes = (client.content_types as string[])?.join(', ') || '';

  const formatGuide = format === 'short'
    ? 'Write a SHORT punchy post: 1–3 sentences max, strong hook, clear CTA. No fluff.'
    : 'Write a LONG post: engaging story or educational thread, 150–300 words, with a hook, body, and CTA.';

  const mediaNote = mediaUrl
    ? `The user has uploaded media to accompany this post: ${mediaUrl}. Reference or describe how it should be used.`
    : '';

  const linkNote = linkUrl
    ? `The client wants to repurpose content from this link: ${linkUrl}. Summarize its key message and adapt it into a post for each platform.`
    : '';

  const contextBlock = `
Business: ${company} | Industry: ${industry} | Brand Voice: ${voice}
Campaign Goal: ${goal}
Target Audience: ${audienceType} · ${ageRange}${targetDesc ? ` — "${targetDesc}"` : ''}
${contentTypes ? `Preferred Content Style: ${contentTypes}` : ''}
${mediaNote}
${linkNote}
User's task/brief: "${task || 'Create a relevant post based on the business profile'}"
  `.trim();

  if (USE_MOCK) {
    await delay(2000);
    return platforms.map((platform) => ({
      platform,
      caption: `✨ [Mock ${format} post for ${platform}]\n\n${task || `Here's what ${company} is all about in ${industry}.`}\n\n#${company.replace(/\s/g, '')} #${industry.replace(/[\s/]/g, '')}`,
      visualPrompt: `A ${voice?.toLowerCase()} branded image for ${company} on ${platform}. ${industry} aesthetic.`,
    }));
  }

  const results = await Promise.all(
    platforms.map(async (platform) => {
      const platformTone =
        platform === 'Instagram' ? 'visual, emotional, aesthetic' :
        platform === 'LinkedIn' ? 'professional, story-driven, insightful' :
        platform === 'TikTok' ? 'fun, trend-aware, conversational' :
        platform === 'Facebook' ? 'community-friendly, warm, shareable' :
        'punchy, direct, under 280 chars';

      const caption = await callAI(
        `You are a social media copywriter. Write a ${platform} post for this business.

${contextBlock}

Platform tone: ${platformTone}
${formatGuide}
Write ONLY the caption. Include relevant emojis and 3–5 hashtags at the end.`
      );

      const visualPrompt = await callAI(
        `Write an AI image generation prompt for a ${platform} post for ${company}.
Industry: ${industry}. Brand voice: ${voice}. Task: "${task || 'brand awareness'}".
Output only the image prompt — vivid, specific, brand-aligned, 1–2 sentences.`
      );

      return { platform, caption, visualPrompt };
    })
  );

  return results;
}

// ─── Generate AI company summary (4-5 lines) ─────────────────────────────────
export async function generateClientSummary(client: AppClient): Promise<string> {
  if (USE_MOCK) {
    await delay(800);
  }

  return buildClientSummary(client, client.research_notes);
}

// ─── Analyze image with Gemini Vision ────────────────────────────────────────
export async function analyzeImageAndGenerateCaption(
  imageBase64: string,
  mimeType: string,
  platform: string,
  brandVoice: string,
  companyName: string,
  goal: string,
): Promise<{ caption: string; visualPrompt: string }> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const prompt = `You are a social media expert for ${companyName}.
Brand voice: ${brandVoice}. Platform: ${platform}. Goal: ${goal}.

Look at this image carefully. Then:
1. Write an engaging ${platform} caption (with relevant emojis and hashtags) in the brand voice that describes or promotes what you see in the image.
2. Write a 1-sentence AI image generation prompt that could recreate a similar visual.

Respond in this exact JSON format:
{"caption": "...", "visualPrompt": "..."}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.8 },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Gemini error');

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[0] ?? '{}');
  return {
    caption: parsed.caption ?? '',
    visualPrompt: parsed.visualPrompt ?? '',
  };
}
