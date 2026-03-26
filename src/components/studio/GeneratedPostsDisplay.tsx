import { Button } from "@/components/ui/button";
import { CheckCircle2, BookmarkPlus } from "lucide-react";
import type { AppPost } from "@/types";
import type { runContentTask } from "@/services/agentService";

type PostFormat = "short" | "long";
type GeneratedPost = Awaited<ReturnType<typeof runContentTask>>[number];
type UploadedMedia = { url: string; kind: "image" | "video"; name: string };

interface Props {
  generatedPosts: GeneratedPost[];
  savedPostIds: Set<number>;
  uploadedMedia: UploadedMedia | null;
  format: PostFormat;
  onSavePost: (post: GeneratedPost, index: number) => void;
  onReset: () => void;
}

export default function GeneratedPostsDisplay({ generatedPosts, savedPostIds, uploadedMedia, format, onSavePost, onReset }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="font-display font-semibold">Posts ready!</span>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="font-display">
          + New Post
        </Button>
      </div>
      {generatedPosts.map((post, i) => {
        const saved = savedPostIds.has(i);
        return (
          <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-display font-semibold">{post.platform}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-body">
                  {format === "short" ? "Short Post" : "Long Post"}
                </span>
              </div>
              <Button
                size="sm"
                variant={saved ? "secondary" : "outline"}
                onClick={() => !saved && onSavePost(post, i)}
                disabled={saved}
                className={`font-display gap-1.5 text-xs ${saved ? "text-green-400 border-green-500/30" : "border-primary/30 text-primary hover:bg-primary/10"}`}
              >
                {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                {saved ? "Saved to Queue" : "Save to Queue"}
              </Button>
            </div>
            {uploadedMedia && (
              <div className="rounded-lg border border-border/60 bg-background/70 p-3 space-y-2">
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                  Attached {uploadedMedia.kind}
                </p>
                {uploadedMedia.kind === "video" ? (
                  <video src={uploadedMedia.url} className="max-h-64 w-full rounded-lg border border-border object-cover" controls />
                ) : (
                  <img src={uploadedMedia.url} alt={uploadedMedia.name} className="max-h-64 w-full rounded-lg border border-border object-cover" />
                )}
              </div>
            )}
            <p className="text-sm font-body text-foreground whitespace-pre-wrap leading-relaxed">{post.caption}</p>
            {post.visualPrompt && (
              <p className="text-xs text-muted-foreground font-body border-t border-border/50 pt-2">
                🎨 Visual: {post.visualPrompt}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Re-export type for parent convenience
export type { GeneratedPost, UploadedMedia };
