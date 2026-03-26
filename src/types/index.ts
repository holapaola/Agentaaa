// Shared TypeScript types for the AgentAAA Platform

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook';
  username: string;
  access_token?: string;
  connected: boolean;
  created_at: string;
}

export interface ScheduledPost {
  id: string;
  user_id: string;
  platform: SocialAccount['platform'];
  content: string;
  media_urls?: string[];
  scheduled_at: string;
  published_at?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  created_at: string;
}

export interface ActionItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  due_date?: string;
  created_at: string;
}

export interface AnalyticsData {
  platform: SocialAccount['platform'];
  period: string;
  impressions: number;
  reach: number;
  engagements: number;
  followers: number;
  posts_count: number;
}

export interface AIInsight {
  id: string;
  user_id: string;
  type: 'content_idea' | 'caption' | 'hashtags' | 'strategy';
  prompt: string;
  result: string;
  created_at: string;
}

export interface AppPost {
  id: string;
  client_id: string;
  caption_text: string | null;
  ai_visual_prompt: string | null;
  image_url?: string | null;
  video_url?: string | null;
  platform: string | null;
  content_pillar?: string | null;
  status: string;
  scheduled_at: string | null;
  created_at?: string;
  clients?: {
    company_name?: string;
  } | null;
}

export interface AppClient {
  id: string;
  company_name: string;
  industry: string;
  brand_voice: string;
  website_url?: string | null;
  business_description?: string | null;
  logo_url?: string | null;
  platforms?: string[];
  ai_summary?: string | null;
  campaign_goal?: string | null;
  target_audience_type?: string | null;
  target_age_range?: string | null;
  target_description?: string | null;
  content_types?: string[];
  posting_frequency?: string | null;
  pipeline_status?: string | null;
  research_notes?: string | null;
  content_strategy?: string | null;
  deleted_at?: string | null;
  slot_locked_until?: string | null;
  posts?: AppPost[];
}
