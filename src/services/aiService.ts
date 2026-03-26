import type { AIInsight } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { NO_PLANS_MODE } from '@/lib/appMode';

const openAiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

// ── Subscription guard ────────────────────────────────────────────────────────
export async function checkSubscription(userId: string): Promise<void> {
  if (NO_PLANS_MODE) {
    return;
  }

  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .single();

  const status = data?.subscription_status ?? "inactive";
  if (status !== "trialing" && status !== "active") {
    throw new Error("SUBSCRIPTION_REQUIRED");
  }
}

// ── OpenAI helper ─────────────────────────────────────────────────────────────

async function callOpenAI(prompt: string): Promise<string> {
  if (!openAiKey) {
    return '[AI service not configured – please set VITE_OPENAI_API_KEY]';
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.choices[0]?.message?.content as string) ?? '';
}

export async function generateContentIdea(userId: string, topic: string): Promise<string> {
  await checkSubscription(userId);
  return callOpenAI(`Generate 3 engaging social media content ideas for the topic: "${topic}". Format as a numbered list.`);
}

export async function generateCaption(userId: string, platform: string, topic: string): Promise<string> {
  await checkSubscription(userId);
  return callOpenAI(`Write a compelling ${platform} caption about "${topic}". Include relevant hashtags.`);
}

export async function generateHashtags(userId: string, topic: string): Promise<string> {
  await checkSubscription(userId);
  return callOpenAI(`Generate 15 relevant hashtags for "${topic}". Return only the hashtags, one per line.`);
}

export async function saveInsight(userId: string, type: AIInsight['type'], prompt: string, result: string): Promise<void> {
  await supabase.from('ai_insights').insert({ user_id: userId, type, prompt, result });
}

export async function getInsights(userId: string): Promise<AIInsight[]> {
  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as AIInsight[];
}
