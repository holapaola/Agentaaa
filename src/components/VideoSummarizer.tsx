import { useState } from "react";
import { Link, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedContent {
  id: string;
  video_url: string;
  summary: string;
  caption_1: string;
  caption_2: string;
  caption_3: string;
}

export default function VideoSummarizer() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      // Insert pending record
      const { data: row, error: insertError } = await supabase
        .from("video_summaries")
        .insert({ video_url: url, status: "processing" })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call AI edge function
      const { data: aiData, error: fnError } = await supabase.functions.invoke(
        "summarize-video",
        { body: { video_url: url } }
      );

      if (fnError) throw fnError;
      if (aiData?.error) throw new Error(aiData.error);

      // Update DB with results
      const { error: updateError } = await supabase
        .from("video_summaries")
        .update({
          summary: aiData.summary,
          caption_1: aiData.caption_1,
          caption_2: aiData.caption_2,
          caption_3: aiData.caption_3,
          status: "completed",
        })
        .eq("id", row.id);

      if (updateError) throw updateError;

      setResult({
        id: row.id,
        video_url: url,
        summary: aiData.summary,
        caption_1: aiData.caption_1,
        caption_2: aiData.caption_2,
        caption_3: aiData.caption_3,
      });

      toast.success("Video analyzed and captions generated!");
      setUrl("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to analyze video");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCaption = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Caption copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const captions = result
    ? [
        { label: "Professional", text: result.caption_1 },
        { label: "Casual & Fun", text: result.caption_2 },
        { label: "Inspirational", text: result.caption_3 },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">AI Video Analyzer</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a craft video link..."
            className="pl-9"
            required
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading} className="shrink-0">
          {isLoading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </form>

      {result && (
        <div className="space-y-3 ">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Summary</h3>
            <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Generated Captions</h3>
            {captions.map((cap, i) => (
              <div
                key={i}
                className="group rounded-lg border border-border bg-card p-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-xs font-medium text-primary mb-1">
                    {cap.label}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {cap.text}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-muted-foreground"
                  onClick={() => copyCaption(cap.text, i)}
                >
                  {copiedIdx === i ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
