import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link, Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedContent { id: string; video_url: string; summary: string; caption_1: string; caption_2: string; caption_3: string }

export default function VideoSection() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data: row, error: insertError } = await supabase.from("video_summaries").insert({ video_url: url, status: "processing" }).select().single();
      if (insertError) throw insertError;
      const { data: aiData, error: fnError } = await supabase.functions.invoke("summarize-video", { body: { video_url: url } });
      if (fnError) throw fnError;
      if (aiData?.error) throw new Error(aiData.error);
      await supabase.from("video_summaries").update({ summary: aiData.summary, caption_1: aiData.caption_1, caption_2: aiData.caption_2, caption_3: aiData.caption_3, status: "completed" }).eq("id", row.id);
      setResult({ ...row, ...aiData });
    } catch {
      toast.error("Could not summarize video. Make sure the URL is public.");
    } finally {
      setLoading(false);
    }
  }

  function copyCaption(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎬 Video AI</CardTitle>
        <CardDescription>Paste a public video URL — get a summary + 3 ready-to-post captions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1" />
          <Button type="submit" disabled={loading || !url.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
          </Button>
        </form>

        {result && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 border p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">SUMMARY</p>
              <p className="text-sm">{result.summary}</p>
            </div>
            {[result.caption_1, result.caption_2, result.caption_3].map((c, i) => (
              <div key={i} className="relative rounded-lg bg-muted/50 border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1">CAPTION {i + 1}</p>
                <p className="text-sm pr-8">{c}</p>
                <button onClick={() => copyCaption(c, i)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                  {copiedIdx === i ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
