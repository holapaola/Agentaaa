import { supabase } from '@/integrations/supabase/client';

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

// ── OpenAI ────────────────────────────────────────────────────────────────────
async function callOpenAI(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

const USE_MOCK = !import.meta.env.VITE_OPENAI_API_KEY;

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

  // Use real OpenAI if key present, otherwise mock
  let research: string;
  if (USE_MOCK) {
    await delay(2500);
    research = mockResearchReport(client.company_name, client.industry, client.brand_voice);
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

  await supabase
    .from('clients')
    .update({ research_notes: research, pipeline_status: 'Drafting' })
    .eq('id', clientId);

  await runStrategist(clientId);
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
    strategy = await callOpenAI(
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
        const caption = await callOpenAI(
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
        const visualPrompt = await callOpenAI(
          `Describe an AI image generation prompt for a ${platform} post for ${client.company_name}.
Industry: ${client.industry}. Tone: ${client.brand_voice}. Pillar: ${pillar}.
Output only the image prompt. Make it vivid, specific, and brand-aligned.`
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
export async function runButler(postId: string): Promise<void> {
  const scheduled = new Date();
  scheduled.setDate(scheduled.getDate() + 3);
  scheduled.setHours(10, 0, 0, 0);

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
    caption = await callOpenAI(
      `Rewrite this ${post.platform} post for ${client.company_name} (${client.industry}).
Brand voice: ${client.brand_voice}. Content pillar: ${post.content_pillar}.${feedbackNote}
Write ONLY the new caption with emojis and hashtags. Make it distinctly different from before.`
    );
    visualPrompt = await callOpenAI(
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
  client: Record<string, unknown>;
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

      const caption = await callOpenAI(
        `You are a social media copywriter. Write a ${platform} post for this business.

${contextBlock}

Platform tone: ${platformTone}
${formatGuide}
Write ONLY the caption. Include relevant emojis and 3–5 hashtags at the end.`
      );

      const visualPrompt = await callOpenAI(
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
export async function generateClientSummary(client: ClientRecord): Promise<string> {
  const { company_name, industry, brand_voice, business_description,
    target_audience_type, target_description, target_age_range,
    content_types, posting_frequency, campaign_goal, platforms } = client as any;

  if (USE_MOCK) {
    await delay(800);
    return `${company_name} is a ${industry} business with a ${brand_voice?.toLowerCase()} brand voice. ${business_description || 'They create engaging content for their audience.'} Their primary audience is ${target_description || target_audience_type || 'general consumers'}${target_age_range ? ` aged ${target_age_range}` : ''}. They focus on ${(platforms || []).join(', ') || 'social media'} with ${posting_frequency || 'regular'} posting, aiming to ${campaign_goal?.toLowerCase() || 'grow their online presence'}.`;
  }

  return callOpenAI(
    `You are a brand strategist. Based on this business profile, write a concise 4–5 sentence company analysis that will be shown to the business owner and used to guide all AI content creation. Be specific, warm, and insightful — not generic.

Business name: ${company_name}
Industry/niche: ${industry}
Brand voice: ${brand_voice}
Description: ${business_description || 'Not provided'}
Audience type: ${target_audience_type || 'Not specified'}
Audience description: ${target_description || 'Not specified'}
Audience age range: ${target_age_range || 'Not specified'}
Platforms: ${(platforms || []).join(', ') || 'Not specified'}
Content types: ${(content_types || []).join(', ') || 'Not specified'}
Posting frequency: ${posting_frequency || 'Not specified'}
Campaign goal: ${campaign_goal || 'Not specified'}

Write ONLY the 4–5 sentence analysis. No headers, no bullets. Make it feel like a smart creative partner who truly understands their business.`
  );
}
