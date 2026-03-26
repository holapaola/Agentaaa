import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { generateContentIdea, generateCaption, generateHashtags } from "@/services/aiService";

type Mode = "ideas" | "caption" | "hashtags";
const modes: { id: Mode; label: string }[] = [
  { id: "ideas",    label: "💡 Content Ideas" },
  { id: "caption",  label: "✍️ Caption" },
  { id: "hashtags", label: "#️⃣ Hashtags" },
];

export default function AIToolsSection() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("ideas");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setResult("");
    try {
      let text = "";
      if (mode === "ideas")        text = await generateContentIdea(user!.id, topic);
      else if (mode === "caption") text = await generateCaption(user!.id, platform, topic);
      else                         text = await generateHashtags(user!.id, topic);
      setResult(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setResult(msg === "SUBSCRIPTION_REQUIRED" ? "⚠️ Access setup is still required for this AI tool." : "Error generating content. Check your API key.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><Sparkles className="inline h-4 w-4 mr-1" />AI Content Tools</CardTitle>
        <CardDescription>Generate ideas, captions, and hashtags instantly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {modes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${mode === m.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
              {m.label}
            </button>
          ))}
        </div>

        {mode === "caption" && (
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {["Instagram","Twitter / X","LinkedIn","Facebook","TikTok"].map((p) => <option key={p}>{p}</option>)}
          </select>
        )}

        <Input placeholder={mode === "ideas" ? "e.g. mosaic workshop" : mode === "caption" ? "Describe your post..." : "Your topic or niche"}
          value={topic} onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()} />

        <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</> : "Generate"}
        </Button>

        {result && (
          <div className="relative rounded-lg bg-muted/50 border p-4">
            <p className="text-sm whitespace-pre-wrap pr-8">{result}</p>
            <button onClick={copy} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
