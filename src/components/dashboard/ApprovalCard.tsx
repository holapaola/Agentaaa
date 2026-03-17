import { useState } from 'react';
import { CheckCircle2, RotateCcw, Loader2, Instagram, Linkedin, Twitter, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { runButler, regeneratePost } from '@/services/agentService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PipelinePost } from '@/hooks/usePipeline';

interface ApprovalPost extends PipelinePost {
  company_name: string;
}

interface Props {
  posts: ApprovalPost[];
  onAction: () => void;
}

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="w-4 h-4" />,
  LinkedIn: <Linkedin className="w-4 h-4" />,
  Twitter: <Twitter className="w-4 h-4" />,
};

const PILLAR_COLOR: Record<string, string> = {
  Educational: 'bg-blue-500/10 text-blue-400',
  'Social Proof': 'bg-purple-500/10 text-purple-400',
  'Direct Offer': 'bg-amber-500/10 text-amber-400',
};

export default function ApprovalCard({ posts, onAction }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 glass-card rounded-xl text-muted-foreground">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
        <p className="font-display text-base">No posts awaiting approval.</p>
        <p className="text-sm mt-1">All caught up! The Butler is keeping watch.</p>
      </div>
    );
  }

  const handleApprove = async (postId: string) => {
    setLoadingId(postId);
    try {
      await runButler(postId);
      onAction();
    } finally {
      setLoadingId(null);
    }
  };

  const handleRegenerate = async (postId: string) => {
    setLoadingId(postId);
    try {
      await regeneratePost(postId, feedbacks[postId]);
      setShowFeedback((prev) => ({ ...prev, [postId]: false }));
      setFeedbacks((prev) => ({ ...prev, [postId]: '' }));
      onAction();
    } finally {
      setLoadingId(null);
    }
  };

  const handlePublish = async (postId: string) => {
    setPublishingId(postId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("https://cfgqppdkligczhktouny.supabase.co/functions/v1/publish-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ postId }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        toast.error(result.error ?? "Publish failed");
      } else {
        toast.success("Post published! 🚀" + (result.publishedUrl ? ` View it here: ${result.publishedUrl}` : ""));
        onAction();
      }
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Pending Approval — {posts.length} post{posts.length !== 1 ? 's' : ''}
        </h3>
      </div>

      {posts.map((post) => {
        const isLoading = loadingId === post.id;

        return (
          <div key={post.id} className="glass-card rounded-xl p-5 border border-border/50 space-y-4">
            {/* Post meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {PLATFORM_ICON[post.platform ?? 'Instagram'] ?? null}
                </span>
                <span className="font-display font-semibold text-sm">{post.platform}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="font-body text-xs text-muted-foreground">{post.company_name}</span>
              </div>
              {post.content_pillar && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-body ${
                    PILLAR_COLOR[post.content_pillar] ?? 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {post.content_pillar}
                </span>
              )}
            </div>

            {/* Caption */}
            <div className="bg-secondary/40 rounded-lg p-4">
              <p className="text-sm font-body leading-relaxed whitespace-pre-line text-foreground">
                {post.caption_text ?? '—'}
              </p>
            </div>

            {/* Visual prompt */}
            {post.ai_visual_prompt && (
              <div className="bg-secondary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-body">
                  <span className="text-primary font-semibold">🎨 Visual prompt: </span>
                  {post.ai_visual_prompt}
                </p>
              </div>
            )}

            {/* Feedback input (shown on click) */}
            {showFeedback[post.id] && (
              <Textarea
                value={feedbacks[post.id] ?? ''}
                onChange={(e) =>
                  setFeedbacks((prev) => ({ ...prev, [post.id]: e.target.value }))
                }
                placeholder="Optional: tell the Creative Agent what to change… (e.g. 'make it shorter and more energetic')"
                className="text-sm font-body bg-secondary/40 border-border resize-none"
                rows={2}
              />
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1 flex-wrap">
              <Button
                onClick={() => handleApprove(post.id)}
                disabled={isLoading || !!publishingId}
                className="flex-1 font-display gap-2 bg-green-600 hover:bg-green-500 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve & Schedule
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (showFeedback[post.id]) {
                    handleRegenerate(post.id);
                  } else {
                    setShowFeedback((prev) => ({ ...prev, [post.id]: true }));
                  }
                }}
                disabled={isLoading || !!publishingId}
                className="flex-1 font-display gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                {showFeedback[post.id] ? 'Regenerate Now' : 'Regenerate'}
              </Button>
              {(post.status === 'Approved' || post.status === 'Scheduled') && (
                <Button
                  onClick={() => handlePublish(post.id)}
                  disabled={isLoading || publishingId === post.id}
                  className="w-full font-display gap-2 bg-primary/90 hover:bg-primary text-primary-foreground"
                >
                  {publishingId === post.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Publish Now
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
