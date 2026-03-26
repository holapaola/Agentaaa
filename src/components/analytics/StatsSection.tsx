import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

export default function StatsSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ total: 0, pending: 0, approved: 0, scheduled: 0 });
  const [byPlatform, setByPlatform] = useState<{ platform: string; count: number }[]>([]);
  const [byClient, setByClient] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const profile = await getProfileForUser<{ agency_id: string | null }>(user.id, "agency_id");
      if (!profile?.agency_id) { setLoading(false); return; }

      const { data: clients } = await selectAgencyClients<{ id: string; company_name: string }>(profile.agency_id, "id, company_name");
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
