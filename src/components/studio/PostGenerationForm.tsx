import { useRef } from "react";
import { Sparkles, FileText, Megaphone, ImageIcon, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PLATFORMS = [
  { id: "Instagram", emoji: "📸" },
  { id: "LinkedIn", emoji: "💼" },
  { id: "Twitter / X", emoji: "🐦" },
  { id: "Facebook", emoji: "📘" },
  { id: "TikTok", emoji: "🎵" },
];

type PostFormat = "short" | "long";

interface Props {
  task: string;
  setTask: (v: string) => void;
  platforms: string[];
  togglePlatform: (p: string) => void;
  format: PostFormat;
  setFormat: (f: PostFormat) => void;
  mediaFile: File | null;
  mediaPreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveMedia: () => void;
  linkUrl: string;
  setLinkUrl: (v: string) => void;
  onGenerate: () => void;
  canGenerate: boolean;
}

export default function PostGenerationForm({
  task, setTask, platforms, togglePlatform, format, setFormat,
  mediaFile, mediaPreview, onFileChange, onRemoveMedia,
  linkUrl, setLinkUrl, onGenerate, canGenerate,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="rounded-xl bg-primary/8 border border-primary/15 px-4 py-3">
          <p className="text-xs font-display font-semibold uppercase tracking-wider text-primary">Assistant</p>
          <p className="mt-1 text-sm text-muted-foreground font-body leading-relaxed">
            Tell me the goal, then add a photo, video, or link if you have one. I&apos;ll shape the copy around it so the post feels tailored to the client.
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground font-body mb-2">✏️ What do you want to post about?</p>
          <Textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Example: Announce our new workshop, use the attached studio photo, and invite beginners to book this month."
            className="bg-secondary border-border font-body resize-none text-sm"
            rows={5}
          />
        </div>

        <div>
          <p className="text-sm text-muted-foreground font-body mb-2">🔗 Optional link to repurpose</p>
          <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2">
            <span className="text-muted-foreground text-sm">🌐</span>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 bg-transparent text-sm font-body outline-none placeholder:text-muted-foreground/50"
            />
            {linkUrl && (
              <button onClick={() => setLinkUrl("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground font-body mb-2">📎 Add a photo or video</p>
          {mediaPreview ? (
            <div className="relative">
              {mediaFile?.type.startsWith("video") ? (
                <video src={mediaPreview} className="h-36 w-full rounded-lg object-cover border border-border" controls />
              ) : (
                <img src={mediaPreview} alt="preview" className="h-36 w-full rounded-lg object-cover border border-border" />
              )}
              <button
                onClick={onRemoveMedia}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="mt-2 text-xs text-muted-foreground font-body">
                This media will be attached to every saved post from this draft.
              </p>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-5 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <div className="flex gap-3">
                <ImageIcon className="w-5 h-5" />
                <Video className="w-5 h-5" />
              </div>
              <span className="text-sm font-body">Upload photo or video</span>
              <span className="text-xs font-body text-muted-foreground/70">Use client photos, product shots, reels, or behind-the-scenes clips.</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFileChange} />
        </div>

        <div>
          <p className="text-sm text-muted-foreground font-body mb-2">📐 Post format</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "short" as PostFormat, icon: Megaphone, label: "Short", desc: "Quick hook" },
              { id: "long" as PostFormat, icon: FileText, label: "Long", desc: "Story-led" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  format === f.id ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-muted-foreground/30"
                }`}
              >
                <f.icon className={`w-4 h-4 mb-2 ${format === f.id ? "text-primary" : "text-muted-foreground"}`} />
                <div className={`font-display font-semibold text-sm ${format === f.id ? "text-foreground" : "text-muted-foreground"}`}>{f.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1 font-body">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground font-body mb-2">📣 Platforms</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button key={p.id} onClick={() => togglePlatform(p.id)}
                className={`px-3 py-2 rounded-lg border text-sm font-body transition-all flex items-center gap-2 ${
                  platforms.includes(p.id) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30"
                }`}>
                <span>{p.emoji}</span> {p.id}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={onGenerate} disabled={!canGenerate} className="w-full font-display glow-gold h-11 text-base">
          <Sparkles className="w-5 h-5 mr-2" /> Generate Posts
        </Button>
      </div>
    </div>
  );
}
