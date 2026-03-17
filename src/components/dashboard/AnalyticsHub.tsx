import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Minus, Hash, Link, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateContentIdea, generateCaption, generateHashtags } from "../../services/aiService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ─── Analytics helpers ─────────────────────────────────────────────────────────
const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

interface MetricBar { label: string; value: number; max: number; color: string }
function BarRow({ label, value, max, color }: MetricBar) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right font-medium text-foreground">{fmt(value)}</span>
    </div>
  );
}

// ─── Real Stats Section ────────────────────────────────────────────────────────
function StatsSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ total: 0, pending: 0, approved: 0, scheduled: 0 });
  const [byPlatform, setByPlatform] = useState<{ platform: string; count: number }[]>([]);
  const [byClient, setByClient] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: profile } = await supabase.from("profiles").select("agency_id").eq("id", user.id).single();
      if (!profile?.agency_id) { setLoading(false); return; }

      const { data: clients } = await supabase.from("clients").select("id, company_name").eq("agency_id", profile.agency_id);
      if (!clients || clients.length === 0) { setLoading(false); return; }
      const clientIds = clients.map((c) => c.id);

      const { data: posts } = await supabase.from("posts").select("id, status, platform, client_id").in("client_id", clientIds);
      if (!posts) { setLoading(false); return; }

      const total = posts.length;
      const pending = posts.filter((p) => p.status === "Pending_Approval").length;
      const approved = posts.filter((p) => p.status === "Approved").length;
      const scheduled = posts.filter((p) => p.status === "Scheduled").length;
      setTotals({ total, pending, approved, scheduled });

      const platMap: Record<string, number> = {};
      posts.forEach((p) => { platMap[p.platform] = (platMap[p.platform] ?? 0) + 1; });
      setByPlatform(Object.entries(platMap).map(([platform, count]) => ({ platform, count })).sort((a, b) => b.count - a.count));

      const clientMap: Record<string, number> = {};
      posts.forEach((p) => { clientMap[p.client_id] = (clientMap[p.client_id] ?? 0) + 1; });
      setByClient(Object.entries(clientMap).map(([id, count]) => ({
        name: clients.find((c) => c.id === id)?.company_name ?? "Unknown",
        count,
      })).sort((a, b) => b.count - a.count));

      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const maxPlat = byPlatform[0]?.count ?? 1;
  const maxClient = byClient[0]?.count ?? 1;
  const platColors: Record<string, string> = {
    Instagram: "bg-pink-400", LinkedIn: "bg-blue-500", Twitter: "bg-sky-400",
    Facebook: "bg-indigo-500", TikTok: "bg-purple-500",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Posts", value: totals.total, color: "text-foreground" },
          { label: "Pending Approval", value: totals.pending, color: "text-yellow-400" },
          { label: "Approved", value: totals.approved, color: "text-green-400" },
          { label: "Scheduled", value: totals.scheduled, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-3xl font-bold font-display ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Posts by Platform</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byPlatform.length === 0
              ? <p className="text-sm text-muted-foreground">No posts yet.</p>
              : byPlatform.map((p) => (
                  <BarRow key={p.platform} label={p.platform} value={p.count} max={maxPlat}
                    color={platColors[p.platform] ?? "bg-violet-400"} />
                ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Posts by Client</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {byClient.length === 0
              ? <p className="text-sm text-muted-foreground">No clients yet.</p>
              : byClient.map((c, i) => (
                  <BarRow key={c.name} label={c.name} value={c.count} max={maxClient}
                    color={["bg-violet-400","bg-emerald-400","bg-amber-400","bg-rose-400","bg-cyan-400"][i % 5]} />
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Per-Client Stats Section ──────────────────────────────────────────────────
function ClientStatsSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Load clients for this agency
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase.from("profiles").select("agency_id").eq("id", user.id).single();
      if (!profile?.agency_id) { setLoading(false); return; }
      const { data } = await supabase.from("clients").select("id, company_name").eq("agency_id", profile.agency_id).order("company_name");
      setClients(data ?? []);
      if (data && data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    })();
  }, [user]);

  // Load posts for selected client
  useEffect(() => {
    if (!selectedId) return;
    setLoadingPosts(true);
    supabase.from("posts").select("id, status, platform, created_at").eq("client_id", selectedId).then(({ data }) => {
      setPosts(data ?? []);
      setLoadingPosts(false);
    });
  }, [selectedId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (clients.length === 0) return <p className="text-sm text-muted-foreground py-8">No clients yet.</p>;

  const statuses = ["Pending_Approval", "Approved", "Scheduled", "Researching", "Drafting"];
  const statusColors: Record<string, string> = {
    Pending_Approval: "bg-yellow-400", Approved: "bg-green-400",
    Scheduled: "bg-primary", Researching: "bg-sky-400", Drafting: "bg-violet-400",
  };
  const statusLabels: Record<string, string> = {
    Pending_Approval: "Pending Approval", Approved: "Approved",
    Scheduled: "Scheduled", Researching: "Researching", Drafting: "Drafting",
  };
  const platColors: Record<string, string> = {
    Instagram: "bg-pink-400", LinkedIn: "bg-blue-500", Twitter: "bg-sky-400",
    Facebook: "bg-indigo-500", TikTok: "bg-purple-500",
  };

  const statusCounts = statuses.map((s) => ({ s, count: posts.filter((p) => p.status === s).length })).filter((x) => x.count > 0);
  const platMap: Record<string, number> = {};
  posts.forEach((p) => { platMap[p.platform] = (platMap[p.platform] ?? 0) + 1; });
  const platRows = Object.entries(platMap).sort((a, b) => b[1] - a[1]);
  const maxStat = Math.max(...statusCounts.map((x) => x.count), 1);
  const maxPlat = platRows[0]?.[1] ?? 1;

  return (
    <div className="space-y-4">
      {/* Client selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground shrink-0">Viewing client:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg border border-border bg-background text-foreground text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
      </div>

      {loadingPosts
        ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        : posts.length === 0
          ? <p className="text-sm text-muted-foreground py-6">No posts yet for this client.</p>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total */}
              <Card className="md:col-span-2">
                <CardContent className="pt-5 pb-4 flex items-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Posts</p>
                    <p className="text-4xl font-bold font-display">{posts.length}</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {statusCounts.map(({ s, count }) => (
                      <div key={s} className="flex items-center gap-1.5 text-sm">
                        <span className={`w-2 h-2 rounded-full ${statusColors[s]}`} />
                        <span className="text-muted-foreground">{statusLabels[s]}:</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By status */}
              <Card>
                <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {statusCounts.map(({ s, count }) => (
                    <BarRow key={s} label={statusLabels[s]} value={count} max={maxStat} color={statusColors[s]} />
                  ))}
                </CardContent>
              </Card>

              {/* By platform */}
              <Card>
                <CardHeader><CardTitle className="text-base">By Platform</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {platRows.length === 0
                    ? <p className="text-sm text-muted-foreground">No platform data.</p>
                    : platRows.map(([platform, count]) => (
                        <BarRow key={platform} label={platform} value={count} max={maxPlat}
                          color={platColors[platform] ?? "bg-violet-400"} />
                      ))}
                </CardContent>
              </Card>
            </div>
          )}
    </div>
  );
}

// ─── Trending topics ──────────────────────────────────────────────────────────
const trends = [
  { tag: "#AIMarketing",      volume: "24.5K", change: 18 },
  { tag: "#BrandStrategy",    volume: "18.2K", change: 12 },
  { tag: "#ContentCreator",   volume: "42.1K", change: -3 },
  { tag: "#SocialMediaTips",  volume: "31.8K", change: 7 },
  { tag: "#DigitalAgency",    volume: "9.4K",  change: 24 },
  { tag: "#GrowthHacking",    volume: "15.6K", change: 0 },
];

function TrendSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Trending Topics</CardTitle>
        <CardDescription>Popular hashtags in your industry</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {trends.map((t, i) => {
          const up = t.change > 0, down = t.change < 0;
          return (
            <div key={t.tag} className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-secondary/60 transition-colors" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-2.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t.tag.slice(1)}</p>
                  <p className="text-xs text-muted-foreground">{t.volume} posts</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-green-500" : down ? "text-red-500" : "text-gray-500"}`}>
                {up ? <TrendingUp className="h-3.5 w-3.5" /> : down ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                {Math.abs(t.change)}%
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── AI Tools (ideas / captions / hashtags) ───────────────────────────────────
type Mode = "ideas" | "caption" | "hashtags";
const modes: { id: Mode; label: string }[] = [
  { id: "ideas",    label: "💡 Content Ideas" },
  { id: "caption",  label: "✍️ Caption" },
  { id: "hashtags", label: "#️⃣ Hashtags" },
];

function AIToolsSection() {
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
      if (mode === "ideas")    text = await generateContentIdea(user!.id, topic);
      else if (mode === "caption") text = await generateCaption(user!.id, platform, topic);
      else                     text = await generateHashtags(user!.id, topic);
      setResult(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setResult(msg === "SUBSCRIPTION_REQUIRED" ? "⚠️ Active subscription required." : "Error generating content. Check your API key.");
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

// ─── Video AI ─────────────────────────────────────────────────────────────────
interface GeneratedContent { id: string; video_url: string; summary: string; caption_1: string; caption_2: string; caption_3: string }

function VideoSection() {
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
    } catch (err) {
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

// ─── Hub ──────────────────────────────────────────────────────────────────────
type Section = "stats" | "clients" | "trends" | "tools" | "video";
const sections: { id: Section; label: string }[] = [
  { id: "stats",   label: "📊 Overview" },
  { id: "clients", label: "👤 By Client" },
  { id: "trends",  label: "📈 Trends" },
  { id: "tools",   label: "✨ AI Tools" },
  { id: "video",   label: "🎬 Video AI" },
];

export default function AnalyticsHub() {
  const [section, setSection] = useState<Section>("stats");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">Performance, trends, and AI-powered content tools</p>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-2 border-b pb-0">
        {sections.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${section === s.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {section === "stats"   && <StatsSection />}
      {section === "clients" && <ClientStatsSection />}
      {section === "trends"  && <TrendSection />}
      {section === "tools"   && <AIToolsSection />}
      {section === "video"   && <VideoSection />}
    </div>
  );
}
