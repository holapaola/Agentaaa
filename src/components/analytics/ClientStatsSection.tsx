import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AppPost } from "@/types";
import { selectAgencyClients } from "@/services/clientService";
import { getProfileForUser } from "@/services/profileService";

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

export default function ClientStatsSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const profile = await getProfileForUser<{ agency_id: string | null }>(user.id, "agency_id");
      if (!profile?.agency_id) { setLoading(false); return; }
      const { data } = await selectAgencyClients<{ id: string; company_name: string }>(profile.agency_id, "id, company_name", {
        orderBy: "company_name",
        ascending: true,
      });
      setClients(data ?? []);
      if (data && data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    })();
  }, [user]);

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

              <Card>
                <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {statusCounts.map(({ s, count }) => (
                    <BarRow key={s} label={statusLabels[s]} value={count} max={maxStat} color={statusColors[s]} />
                  ))}
                </CardContent>
              </Card>

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
