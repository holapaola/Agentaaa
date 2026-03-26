import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, Sparkles, ArrowRight, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cancelPipeline } from '@/services/agentService';
import type { PipelineClient } from '@/hooks/usePipeline';
import ReportRenderer from './ReportRenderer';

const STAGES = ['Researching', 'Drafting', 'Pending_Approval', 'Scheduled'] as const;
type Stage = typeof STAGES[number];

const STAGE_LABELS: Record<Stage, string> = {
  Researching: 'Researching',
  Drafting: 'Drafting',
  Pending_Approval: 'Pending Approval',
  Scheduled: 'Scheduled',
};

function getStageIndex(status: string | null): number {
  const idx = STAGES.indexOf((status as Stage) ?? 'Researching');
  return idx === -1 ? 0 : idx;
}

interface Props {
  clients: PipelineClient[];
  loading: boolean;
}

export default function PipelineStatus({ clients, loading }: Props) {
  const navigate = useNavigate();
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCancel = async (clientId: string) => {
    setCancelling(clientId);
    await cancelPipeline(clientId);
    setCancelling(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 glass-card rounded-xl border border-border/50 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="font-display text-xl font-bold mb-1">No clients yet</p>
          <p className="text-sm text-muted-foreground font-body max-w-xs">
            Add your first client to launch the Agent Swarm — it'll research, strategize, and write posts automatically.
          </p>
        </div>
        <Button onClick={() => navigate('/onboard')} className="font-display gap-2 glow-gold">
          <Sparkles className="w-4 h-4" />
          Add Your First Client
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {clients.map((client) => {
        const stageIdx = getStageIndex(client.pipeline_status);
        const statusLabel = STAGE_LABELS[(client.pipeline_status as Stage) ?? 'Researching'];

        return (
          <div key={client.id} className="glass-card rounded-xl p-6 border border-border/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-lg">{client.company_name}</h3>
                <p className="text-sm text-muted-foreground font-body">
                  {client.industry} · {client.brand_voice} voice
                </p>
              </div>
              <span
                className={`text-xs px-3 py-1.5 rounded-full font-display font-semibold ${
                  client.pipeline_status === 'Cancelled'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : stageIdx >= 3
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : stageIdx === 2
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-primary/20 text-primary border border-primary/30'
                }`}
              >
                {client.pipeline_status === 'Cancelled' ? '🚫 Cancelled' : statusLabel}
              </span>
              {/* Cancel button — only show while actively running */}
              {stageIdx < 2 && client.pipeline_status !== 'Cancelled' && (
                <button
                  onClick={() => handleCancel(client.id)}
                  disabled={cancelling === client.id}
                  className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1 font-body"
                >
                  {cancelling === client.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <XCircle className="w-3 h-3" />}
                  Stop
                </button>
              )}
            </div>

            {/* Stage stepper */}
            <div className="flex items-start">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        client.pipeline_status === 'Cancelled' && i === stageIdx
                          ? 'bg-red-500/10 border-2 border-red-500/40'
                          : i < stageIdx
                          ? 'bg-primary text-primary-foreground'
                          : i === stageIdx
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-secondary border-2 border-border'
                      }`}
                    >
                      {client.pipeline_status === 'Cancelled' && i === stageIdx ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : i < stageIdx ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : i === stageIdx ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-body text-center leading-tight ${
                        i <= stageIdx ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {STAGE_LABELS[stage]}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`h-px flex-1 mb-5 mx-1 transition-all ${
                        i < stageIdx ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Research notes expandable */}
            {client.research_notes && stageIdx >= 1 && (
              <details className="mt-5 group">
                <summary className="text-xs font-display font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none flex items-center gap-1.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                  Market Research Report
                </summary>
                <div className="mt-3">
                  <ReportRenderer content={client.research_notes} type="research" />
                </div>
              </details>
            )}

            {/* Strategy expandable */}
            {client.content_strategy && stageIdx >= 2 && (
              <details className="mt-3 group">
                <summary className="text-xs font-display font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none flex items-center gap-1.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  Content Strategy
                </summary>
                <div className="mt-3">
                  <ReportRenderer content={client.content_strategy} type="strategy" />
                </div>
              </details>
            )}

            {/* Posts summary */}
            {(client.posts?.length ?? 0) > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-body mb-2">
                  {client.posts.length} post{client.posts.length !== 1 ? 's' : ''} generated
                </p>
                <div className="flex gap-2 flex-wrap">
                  {client.posts.map((post) => (
                    <span
                      key={post.id}
                      className={`text-xs px-2 py-1 rounded font-body ${
                        post.status === 'Scheduled'
                          ? 'bg-green-500/10 text-green-400'
                          : post.status === 'Pending_Approval'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {post.platform} · {post.content_pillar}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
