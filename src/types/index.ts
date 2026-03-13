// Shared TypeScript types for the Agency AAA Platform

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
