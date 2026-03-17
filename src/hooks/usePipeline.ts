import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PipelinePost {
  id: string;
  client_id: string;
  caption_text: string | null;
  ai_visual_prompt: string | null;
  platform: string | null;
  content_pillar: string | null;
  status: string;
  scheduled_at: string | null;
}

export interface PipelineClient {
  id: string;
  company_name: string;
  industry: string;
  brand_voice: string;
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
    if (!user) return;
    try {
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!agency) {
        setClients([]);
        setLoading(false);
        return;
      }

      const { data, error: err } = await supabase
        .from('clients')
        .select(
          `id, company_name, industry, brand_voice,
           pipeline_status, research_notes, content_strategy,
           posts ( id, caption_text, ai_visual_prompt, platform, content_pillar, status, scheduled_at )`
        )
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setClients((data as unknown as PipelineClient[]) ?? []);
    } catch (e) {
      console.error(e);
      setError('Failed to load pipeline');
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
