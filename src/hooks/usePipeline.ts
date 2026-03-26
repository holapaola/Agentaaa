import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AppClient, AppPost } from '@/types';
import { selectAgencyClients } from '@/services/clientService';

export interface PipelinePost extends AppPost {
  content_pillar: string | null;
}

export interface PipelineClient extends AppClient {
  pipeline_status: string | null;
  research_notes: string | null;
  content_strategy: string | null;
  posts: PipelinePost[];
}

export function usePipeline() {
  const { user } = useAuth();
  const [clients, setClients] = useState<PipelineClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    if (!user) {
      setClients([]);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!agency) {
        setClients([]);
        setError(null);
        setLoading(false);
        return;
      }

      const { data, error: err } = await selectAgencyClients<PipelineClient>(
        agency.id,
        `id, company_name, industry, brand_voice, ai_summary, platforms,
          pipeline_status, research_notes, content_strategy,
          posts ( id, caption_text, ai_visual_prompt, image_url, video_url, platform, content_pillar, status, scheduled_at )`,
        { orderBy: "created_at", ascending: false },
      );

      if (err) throw err;
      setClients((data as unknown as PipelineClient[]) ?? []);
      setError(null);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPipeline();

    const clientChannel = supabase
      .channel('pipeline-clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, fetchPipeline)
      .subscribe();

    const postsChannel = supabase
      .channel('pipeline-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPipeline)
      .subscribe();

    return () => {
      supabase.removeChannel(clientChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [fetchPipeline]);

  const pendingApprovalPosts = clients.flatMap((c) =>
    (c.posts ?? [])
      .filter((p) => p.status === 'Pending_Approval')
      .map((p) => ({ ...p, company_name: c.company_name }))
  );

  return { clients, loading, error, pendingApprovalPosts, refetch: fetchPipeline };
}
