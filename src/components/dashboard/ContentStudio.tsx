import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Upload, FileText, Megaphone, ImageIcon, Video, X, Loader2, CheckCircle2, BookmarkPlus, Inbox, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { runContentTask } from "@/services/agentService";
import { usePipeline } from "@/hooks/usePipeline";
import ApprovalCard from "./ApprovalCard";
import BrandProfileCard from "./BrandProfileCard";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "Instagram", emoji: "📸" },
  { id: "LinkedIn", emoji: "💼" },
  { id: "Twitter / X", emoji: "🐦" },
  { id: "Facebook", emoji: "📘" },
  { id: "TikTok", emoji: "🎵" },
];

type PostFormat = "short" | "long";
type Stage = "idle" | "generating" | "done" | "error";

export default function ContentStudio({ clientOverride }: { clientOverride?: any }) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadedClient, setLoadedClient] = useState<any>(clientOverride ?? null);
  const [allClients, setAllClients] = useState<any[]>([]);

  // Load all clients for the selector
  useEffect(() => {
    if (!user) return;
    supabase.from("agencies").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data: agency }) => {
        if (!agency) return;
        return supabase.from("clients").select("*").eq("agency_id", agency.id)
          .order("created_at", { ascending: false });
      })
      .then((res: any) => {
        if (res?.data?.length) {
          setAllClients(res.data);
          // Only auto-select if no override was passed
          if (!clientOverride) setLoadedClient((prev: any) => prev ?? res.data[0]);
        }
      });
  }, [user?.id]);

  // Sync when clientOverride changes (e.g., navigating from Clients tab)
  useEffect(() => {
    if (clientOverride) setLoadedClient(clientOverride);
  }, [clientOverride?.id]);

  const [task, setTask] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["Instagram"]);
  const [format, setFormat] = useState<PostFormat>("short");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<Set<number>>(new Set());
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [stageMsg, setStageMsg] = useState("");
  const [scheduleModal, setScheduleModal] = useState<{ post: any; index: number } | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const fetchPendingPosts = async (clientId: string) => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "Pending_Approval")
      .order("created_at", { ascending: false });
    setPendingPosts(data ?? []);
  };

  // Reload pending posts when client changes
  useEffect(() => {
    if (loadedClient?.id) fetchPendingPosts(loadedClient.id);
    else setPendingPosts([]);
  }, [loadedClient?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!user || (!task.trim() && !mediaFile)) return;
    setStage("generating");
    setGeneratedPosts([]);

    try {
      let client = loadedClient;

      if (!client) {
        setStageMsg("Loading your profile...");
        const { data: agency } = await supabase
          .from("agencies").select("id").eq("user_id", user.id).maybeSingle();
        if (!agency) { setStage("error"); setStageMsg("Please complete onboarding first."); return; }

        const { data: fetchedClient } = await supabase
          .from("clients").select("*").eq("agency_id", agency.id)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!fetchedClient) { setStage("error"); setStageMsg("Please complete onboarding first."); return; }
        client = fetchedClient;
        setLoadedClient(client);
      }

      // Upload media if present
      let mediaUrl: string | null = null;
      if (mediaFile) {
        setStageMsg("Uploading your media...");
        const ext = mediaFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("brand-assets").upload(path, mediaFile);
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from("brand-assets").getPublicUrl(path);
          mediaUrl = publicUrl;
        }
      }

      setStageMsg("Writing your posts...");
      const posts = await runContentTask({
        client,
        task: task.trim(),
        platforms,
        format,
        mediaUrl,
        linkUrl: linkUrl.trim() || null,
      });

      setGeneratedPosts(posts);
      setStage("done");
    } catch (err) {
      console.error(err);
      setStage("error");
      setStageMsg("Something went wrong. Please try again.");
    }
  };

  const saveToQueue = async (post: any, index: number) => {
    if (!loadedClient) return;
    const { error } = await supabase.from("posts").insert({
      client_id: loadedClient.id,
      caption_text: post.caption,
      platform: post.platform,
      ai_visual_prompt: post.visualPrompt ?? null,
      status: "Pending_Approval",
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    });
    if (error) {
      toast.error("Failed to save post.");
    } else {
      setSavedPostIds((prev) => new Set(prev).add(index));
      toast.success(scheduledAt ? `${post.platform} post scheduled! ✅` : `${post.platform} post saved to queue!`);
      fetchPendingPosts(loadedClient.id);
    }
    setScheduleModal(null);
    setScheduledAt("");
  };

  const reset = () => {
    setStage("idle");
    setGeneratedPosts([]);
    setSavedPostIds(new Set());
    setTask("");
    setMediaFile(null);
    setMediaPreview(null);
    setLinkUrl("");
    setStageMsg("");
    setScheduleModal(null);
    setScheduledAt("");
  };

  const canGenerate = platforms.length > 0 && (task.trim().length > 0 || mediaFile !== null || linkUrl.trim().length > 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display font-bold text-xl mb-1">Content Studio</h2>
        <p className="text-sm text-muted-foreground font-body">
          Give the agents a task or upload media — they'll write your posts.
        </p>
      </div>

      {/* Client selector */}
      {allClients.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-body whitespace-nowrap">Creating for:</span>
          <Select
            value={loadedClient?.id ?? ""}
            onValueChange={(id) => {
              const c = allClients.find((x) => x.id === id);
              if (c) setLoadedClient(c);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a client…" />
            </SelectTrigger>
            <SelectContent>
              {allClients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Brand profile */}
      {loadedClient && (
        <BrandProfileCard
          client={loadedClient}
          onSummaryGenerated={(s) => setLoadedClient((c: any) => ({ ...c, ai_summary: s }))}
        />
      )}

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* Media upload */}
            <div>
              <p className="text-sm text-muted-foreground font-body mb-2">📎 Upload a photo or video (optional)</p>
              {mediaPreview ? (
                <div className="relative inline-block">
                  {mediaFile?.type.startsWith("video") ? (
                    <video src={mediaPreview} className="h-36 rounded-lg object-cover border border-border" controls />
                  ) : (
                    <img src={mediaPreview} alt="preview" className="h-36 rounded-lg object-cover border border-border" />
                  )}
                  <button onClick={removeMedia}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
                  <div className="flex gap-3">
                    <ImageIcon className="w-5 h-5" />
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-body">Click to upload photo or video</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Link / URL input */}
            <div>
              <p className="text-sm text-muted-foreground font-body mb-2">🔗 Or paste a link to repurpose (YouTube, article, etc.) — optional</p>
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

            {/* Task input */}
            <div>
              <p className="text-sm text-muted-foreground font-body mb-2">✏️ What do you want to post about?</p>
              <Textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g. Announcing my new mosaic workshop starting next month — beginner friendly, every Saturday morning..."
                className="bg-secondary border-border font-body resize-none text-sm"
                rows={4}
              />
            </div>

            {/* Post format */}
            <div>
              <p className="text-sm text-muted-foreground font-body mb-2">📐 Post format</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "short" as PostFormat, icon: Megaphone, label: "Short Post", desc: "Announcement, quick punch, one-liner with hook" },
                  { id: "long" as PostFormat, icon: FileText, label: "Long Post", desc: "Story, narrative, educational thread" },
                ].map((f) => (
                  <button key={f.id} onClick={() => setFormat(f.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      format === f.id ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-muted-foreground/30"
                    }`}>
                    <f.icon className={`w-5 h-5 mb-2 ${format === f.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className={`font-display font-semibold text-sm ${format === f.id ? "text-foreground" : "text-muted-foreground"}`}>{f.label}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-body">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform picker */}
            <div>
              <p className="text-sm text-muted-foreground font-body mb-2">📣 Post to which platforms?</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p.id} onClick={() => togglePlatform(p.id)}
                    className={`px-4 py-2 rounded-lg border text-sm font-body transition-all flex items-center gap-2 ${
                      platforms.includes(p.id) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30"
                    }`}>
                    <span>{p.emoji}</span> {p.id}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full font-display glow-gold h-12 text-base">
              <Sparkles className="w-5 h-5 mr-2" /> Generate Posts
            </Button>
          </motion.div>
        )}

        {stage === "generating" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-display font-semibold text-lg">Agents are writing...</p>
            <p className="text-sm text-muted-foreground font-body">{stageMsg}</p>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="font-display font-semibold">Posts ready!</span>
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="font-display">
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
                      onClick={() => !saved && setScheduleModal({ post, index: i })}
                      disabled={saved}
                      className={`font-display gap-1.5 text-xs ${saved ? "text-green-400 border-green-500/30" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                    >
                      {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                      {saved ? "Saved to Queue" : "Save to Queue"}
                    </Button>
                  </div>
                  <p className="text-sm font-body text-foreground whitespace-pre-wrap leading-relaxed">{post.caption}</p>
                  {post.visualPrompt && (
                    <p className="text-xs text-muted-foreground font-body border-t border-border/50 pt-2">
                      🎨 Visual: {post.visualPrompt}
                    </p>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 gap-4 text-center">
            <p className="text-muted-foreground font-body">{stageMsg}</p>
            <Button onClick={reset} variant="outline" className="font-display">Try Again</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending approval queue for this client */}
      {pendingPosts.length > 0 && loadedClient && (
        <div className="pt-4 border-t border-border/50">
          <ApprovalCard
            posts={pendingPosts.map((p) => ({ ...p, company_name: loadedClient.company_name }))}
            onAction={() => fetchPendingPosts(loadedClient.id)}
          />
        </div>
      )}

      {/* Schedule / Save modal */}
      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4 mx-4">
            <h3 className="text-base font-semibold font-display text-foreground">Schedule this post</h3>
            <p className="text-xs text-muted-foreground font-body">
              Pick a date &amp; time to schedule, or skip to save as <strong>Pending Approval</strong>.
            </p>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="font-display text-xs" onClick={() => { setScheduleModal(null); setScheduledAt(""); }}>
                Cancel
              </Button>
              <Button variant="outline" size="sm" className="font-display text-xs" onClick={() => saveToQueue(scheduleModal.post, scheduleModal.index)}>
                Skip — Save as Pending
              </Button>
              <Button size="sm" className="font-display text-xs" disabled={!scheduledAt} onClick={() => saveToQueue(scheduleModal.post, scheduleModal.index)}>
                Schedule ✓
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
