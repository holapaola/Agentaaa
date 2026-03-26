import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { runContentTask } from "@/services/agentService";
import ApprovalCard from "./ApprovalCard";
import BrandProfileCard from "./BrandProfileCard";
import { toast } from "sonner";
import type { AppClient, AppPost } from "@/types";
import { selectAgencyClients, selectLatestAgencyClient } from "@/services/clientService";
import ClientSelector from "@/components/studio/ClientSelector";
import PostGenerationForm from "@/components/studio/PostGenerationForm";
import GeneratedPostsDisplay from "@/components/studio/GeneratedPostsDisplay";
import SchedulePostModal from "@/components/studio/SchedulePostModal";

type PostFormat = "short" | "long";
type Stage = "idle" | "generating" | "done" | "error";
type GeneratedPost = Awaited<ReturnType<typeof runContentTask>>[number];
type UploadedMedia = { url: string; kind: "image" | "video"; name: string };

export default function ContentStudio({ clientOverride }: { clientOverride?: AppClient }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [loadedClient, setLoadedClient] = useState<AppClient | null>(clientOverride ?? null);
  const [allClients, setAllClients] = useState<AppClient[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase.from("agencies").select("id").eq("user_id", userId).maybeSingle()
      .then(async ({ data: agency }) => {
        if (!agency) return;
        return selectAgencyClients<AppClient>(agency.id, "*", { orderBy: "created_at", ascending: false });
      })
      .then((res) => {
        if (res?.error) throw res.error;
        if (res?.data?.length) {
          setAllClients(res.data as AppClient[]);
          if (!clientOverride) setLoadedClient((prev) => prev ?? (res.data?.[0] as AppClient));
        }
      })
      .catch((error: unknown) => { console.error("Failed to load clients:", error); });
  }, [clientOverride, userId]);

  useEffect(() => {
    if (clientOverride) setLoadedClient(clientOverride);
  }, [clientOverride]);

  const [task, setTask] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["Instagram"]);
  const [format, setFormat] = useState<PostFormat>("short");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<Set<number>>(new Set());
  const [pendingPosts, setPendingPosts] = useState<AppPost[]>([]);
  const [stageMsg, setStageMsg] = useState("");
  const [scheduleModal, setScheduleModal] = useState<{ post: GeneratedPost; index: number } | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const fetchPendingPosts = async (clientId: string) => {
    const { data, error } = await supabase
      .from("posts").select("*").eq("client_id", clientId).eq("status", "Pending_Approval")
      .order("created_at", { ascending: false });
    if (error) { console.error("Failed to load pending posts:", error); return; }
    setPendingPosts(data ?? []);
  };

  useEffect(() => {
    if (loadedClient?.id) fetchPendingPosts(loadedClient.id);
    else setPendingPosts([]);
  }, [loadedClient?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setUploadedMedia(null);
  };

  const handleGenerate = async () => {
    if (!user) { toast.error("Please sign in to generate content."); return; }
    if (!task.trim() && !mediaFile && !linkUrl.trim()) {
      toast.error("Add a prompt, media file, or link before generating posts.");
      return;
    }
    setStage("generating");
    setGeneratedPosts([]);
    try {
      let client = loadedClient;
      if (!client) {
        setStageMsg("Loading your profile...");
        const { data: agency } = await supabase.from("agencies").select("id").eq("user_id", user.id).maybeSingle();
        if (!agency) { setStage("error"); setStageMsg("Please complete onboarding first."); return; }
        const fetchedClient = await selectLatestAgencyClient<AppClient>(agency.id);
        if (!fetchedClient) { setStage("error"); setStageMsg("Please complete onboarding first."); return; }
        client = fetchedClient;
        setLoadedClient(client);
      }
      let mediaUrl: string | null = null;
      if (mediaFile) {
        setStageMsg("Uploading your media...");
        const ext = mediaFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("brand-assets").upload(path, mediaFile);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from("brand-assets").getPublicUrl(path);
        mediaUrl = publicUrl;
        setUploadedMedia({ url: publicUrl, kind: mediaFile.type.startsWith("video") ? "video" : "image", name: mediaFile.name });
      } else {
        setUploadedMedia(null);
      }
      setStageMsg("Writing your posts...");
      const posts = await runContentTask({ client, task: task.trim(), platforms, format, mediaUrl, linkUrl: linkUrl.trim() || null });
      setGeneratedPosts(posts);
      setStage("done");
    } catch (err: unknown) {
      console.error(err);
      setStage("error");
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setStageMsg(message);
      toast.error(message);
    }
  };

  const saveToQueue = async (post: GeneratedPost, index: number) => {
    if (!loadedClient) return;
    try {
      const { error } = await supabase.from("posts").insert({
        client_id: loadedClient.id,
        caption_text: post.caption,
        platform: post.platform,
        ai_visual_prompt: post.visualPrompt ?? null,
        image_url: uploadedMedia?.kind === "image" ? uploadedMedia.url : null,
        video_url: uploadedMedia?.kind === "video" ? uploadedMedia.url : null,
        status: "Pending_Approval",
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      if (error) throw error;
      setSavedPostIds((prev) => new Set(prev).add(index));
      toast.success(scheduledAt ? `${post.platform} post scheduled! ✅` : `${post.platform} post saved to queue!`);
      fetchPendingPosts(loadedClient.id);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save post.");
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
    setUploadedMedia(null);
    setLinkUrl("");
    setStageMsg("");
    setScheduleModal(null);
    setScheduledAt("");
  };

  const canGenerate = platforms.length > 0 && (task.trim().length > 0 || mediaFile !== null || linkUrl.trim().length > 0);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="font-display font-bold text-xl mb-1">Content Studio</h2>
        <p className="text-sm text-muted-foreground font-body">
          Tell the assistant what you want to publish. You can also upload a photo or video to make every post feel more personal.
        </p>
        <div className="flex flex-wrap gap-2">
          {["Announce something new", "Turn this photo into a caption", "Use this video for a launch post"].map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => setTask((prev) => prev || suggestion)}
              className="rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40">
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <ClientSelector allClients={allClients} loadedClient={loadedClient} onClientChange={setLoadedClient} />

      {loadedClient && (
        <details className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-display font-semibold text-foreground">Client brief</p>
              <p className="text-xs text-muted-foreground font-body">Open for the brand summary, workforce status, research, and strategy.</p>
            </div>
            <span className="text-xs text-muted-foreground font-body">Expand</span>
          </summary>
          <div className="mt-3">
            <BrandProfileCard
              client={loadedClient}
              onSummaryGenerated={(s) => setLoadedClient((c) => (c ? { ...c, ai_summary: s } : c))}
            />
          </div>
        </details>
      )}

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PostGenerationForm
              task={task} setTask={setTask}
              platforms={platforms} togglePlatform={togglePlatform}
              format={format} setFormat={setFormat}
              mediaFile={mediaFile} mediaPreview={mediaPreview}
              onFileChange={handleFileChange} onRemoveMedia={removeMedia}
              linkUrl={linkUrl} setLinkUrl={setLinkUrl}
              onGenerate={handleGenerate} canGenerate={canGenerate}
            />
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
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GeneratedPostsDisplay
              generatedPosts={generatedPosts}
              savedPostIds={savedPostIds}
              uploadedMedia={uploadedMedia}
              format={format}
              onSavePost={(post, index) => setScheduleModal({ post, index })}
              onReset={reset}
            />
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

      {pendingPosts.length > 0 && loadedClient && (
        <div className="pt-4 border-t border-border/50">
          <ApprovalCard
            posts={pendingPosts.map((p) => ({ ...p, company_name: loadedClient.company_name }))}
            onAction={() => fetchPendingPosts(loadedClient.id)}
          />
        </div>
      )}

      <SchedulePostModal
        isOpen={scheduleModal !== null}
        scheduledAt={scheduledAt}
        setScheduledAt={setScheduledAt}
        onSave={() => scheduleModal && saveToQueue(scheduleModal.post, scheduleModal.index)}
        onClose={() => { setScheduleModal(null); setScheduledAt(""); }}
      />
    </div>
  );
}
