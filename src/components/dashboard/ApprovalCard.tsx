import { useState, useRef } from 'react';
import { CheckCircle2, RotateCcw, Loader2, Instagram, Linkedin, Twitter, Sparkles, Send, Copy, Upload, ImagePlus, Wand2, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { runButler, regeneratePost, analyzeImageAndGenerateCaption } from '@/services/agentService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PipelinePost } from '@/hooks/usePipeline';
import ScheduleCalendarModal from './ScheduleCalendarModal';

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
  const [schedulingPost, setSchedulingPost] = useState<ApprovalPost | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  const [localCaptions, setLocalCaptions] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 glass-card rounded-xl text-muted-foreground">
        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
        <p className="font-display text-base">No posts awaiting approval.</p>
        <p className="text-sm mt-1">All caught up! The Butler is keeping watch.</p>
      </div>
    );
  }

  const handleApprove = async (postId: string, scheduledAt: Date) => {
    setLoadingId(postId);
    setSchedulingPost(null);
    try {
      await runButler(postId, scheduledAt);
      toast.success('Post scheduled! 🗓️');
      onAction();
    } catch {
      toast.error('Failed to schedule post.');
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

  const handleImageUpload = async (post: ApprovalPost, file: File) => {
    const postId = post.id;
    setUploadingId(postId);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `post-images/${postId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('brand-assets')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(path);
      await supabase.from('posts').update({ image_url: publicUrl }).eq('id', postId);
      setLocalImages((prev) => ({ ...prev, [postId]: publicUrl }));
      toast.success('Image uploaded! Analyzing with Gemini… 🔍');

      // Convert to base64 and analyze
      setAnalyzingId(postId);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await analyzeImageAndGenerateCaption(
            base64,
            file.type,
            post.platform ?? 'Instagram',
            'casual and friendly',
            post.company_name,
            'brand awareness',
          );
          // Save new caption + visual prompt
          await supabase.from('posts').update({
            caption_text: result.caption,
            ai_visual_prompt: result.visualPrompt,
          }).eq('id', postId);
          setLocalCaptions((prev) => ({ ...prev, [postId]: result.caption }));
          toast.success('Caption generated from your image! ✨');
        } catch {
          toast.error('Image analysis failed — caption unchanged.');
        } finally {
          setAnalyzingId(null);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Upload failed — try again.');
      setAnalyzingId(null);
    } finally {
      setUploadingId(null);
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
            <div className="bg-secondary/40 rounded-lg p-4 relative">
              {analyzingId === post.id && (
                <div className="absolute inset-0 rounded-lg bg-background/70 flex items-center justify-center gap-2 z-10">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs font-display font-semibold text-primary">Gemini is analyzing your image…</span>
                </div>
              )}
              <p className="text-sm font-body leading-relaxed whitespace-pre-line text-foreground">
                {localCaptions[post.id] ?? post.caption_text ?? '—'}
              </p>
            </div>

            {(post.image_url || post.video_url) && (
              <div className="rounded-lg border border-border/60 bg-background/70 p-3 space-y-2">
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                  Attached media
                </p>
                {post.video_url ? (
                  <video
                    src={post.video_url}
                    className="max-h-56 w-full rounded-lg border border-border object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={post.image_url ?? ""}
                    alt="Attached post media"
                    className="max-h-56 w-full rounded-lg border border-border object-cover"
                  />
                )}
              </div>
            )}

            {/* Visual prompt + image */}
            {post.ai_visual_prompt && (
              <div className="rounded-lg border border-border/50 bg-secondary/20 overflow-hidden">
                {/* Image preview — show uploaded or existing */}
                {(localImages[post.id] || post.image_url) ? (
                  <div className="relative group">
                    <img
                      src={localImages[post.id] ?? post.image_url ?? ''}
                      alt="Post visual"
                      className="w-full max-h-64 object-cover"
                    />
                    {/* Replace image button on hover */}
                    <button
                      onClick={() => fileInputRefs.current[post.id]?.click()}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-xs font-display"
                    >
                      <Upload className="w-5 h-5" />
                      Replace image
                    </button>
                  </div>
                ) : (
                  /* No image yet — big upload zone */
                  <button
                    onClick={() => fileInputRefs.current[post.id]?.click()}
                    disabled={uploadingId === post.id}
                    className="w-full flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors border-b border-border/40"
                  >
                    {uploadingId === post.id ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <ImagePlus className="w-6 h-6" />
                    )}
                    <span className="text-xs font-display font-semibold">
                      {uploadingId === post.id ? 'Uploading…' : 'Upload image for this post'}
                    </span>
                  </button>
                )}

                {/* Hidden file input */}
                <input
                  ref={(el) => { fileInputRefs.current[post.id] = el; }}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(post, file);
                    e.target.value = '';
                  }}
                />

                {/* Prompt text + copy button */}
                <div className="p-3 flex items-start gap-2">
                  <p className="text-xs text-muted-foreground font-body flex-1 leading-relaxed">
                    <span className="text-primary font-semibold">🎨 Visual prompt: </span>
                    {post.ai_visual_prompt}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(post.ai_visual_prompt ?? '');
                      toast.success('Prompt copied! Paste into Midjourney, DALL·E, or Sora 🎨');
                    }}
                    className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Copy prompt to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                onClick={() => setSchedulingPost(post)}
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
      <ScheduleCalendarModal
        isOpen={!!schedulingPost}
        onClose={() => setSchedulingPost(null)}
        onConfirm={(date) => schedulingPost && handleApprove(schedulingPost.id, date)}
        postPlatform={schedulingPost?.platform}
      />
    </div>
  );
}
