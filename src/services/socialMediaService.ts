import type { SocialAccount, ScheduledPost } from '../types';
import { supabase } from './supabase';

// ── Social accounts ──────────────────────────────────────────────────────────

export async function getSocialAccounts(
  userId: string
): Promise<SocialAccount[]> {
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []) as SocialAccount[];
}

export async function connectAccount(
  userId: string,
  platform: SocialAccount['platform'],
  username: string
): Promise<void> {
  await supabase.from('social_accounts').upsert({
    user_id: userId,
    platform,
    username,
    connected: true,
  });
}

export async function disconnectAccount(accountId: string): Promise<void> {
  await supabase
    .from('social_accounts')
    .update({ connected: false })
    .eq('id', accountId);
}

// ── Scheduled posts ──────────────────────────────────────────────────────────

export async function getScheduledPosts(
  userId: string
): Promise<ScheduledPost[]> {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ScheduledPost[];
}

export async function createScheduledPost(
  post: Omit<ScheduledPost, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('scheduled_posts').insert(post);
  if (error) throw error;
}

export async function updatePostStatus(
  postId: string,
  status: ScheduledPost['status']
): Promise<void> {
  await supabase
    .from('scheduled_posts')
    .update({ status })
    .eq('id', postId);
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('scheduled_posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
}
