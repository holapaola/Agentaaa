import { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getProfileForUser } from '@/services/profileService';

type StatItem = { label: string; value: string; icon: React.ElementType; color: string; bg: string };
type ActivityItem = { icon: string; text: string; time: string };

const PLATFORM_EMOJI: Record<string, string> = {
  Instagram: '📸', LinkedIn: '💼', 'Twitter / X': '🐦', Facebook: '📘', TikTok: '🎵',
};
const STATUS_VERB: Record<string, string> = {
  Scheduled: 'scheduled', Published: 'published', Pending_Approval: 'drafted', Approved: 'approved',
};

function formatAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString();
}

const EMPTY_STATS: StatItem[] = [
  { label: 'Active Clients',   value: '—', icon: Users,       color: 'text-blue-500',   bg: 'bg-blue-50' },
  { label: 'Scheduled Posts',  value: '—', icon: FileText,    color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Published Posts',  value: '—', icon: TrendingUp,  color: 'text-green-500',  bg: 'bg-green-50' },
  { label: 'Pending Actions',  value: '—', icon: Zap,         color: 'text-orange-500', bg: 'bg-orange-50' },
];

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>(EMPTY_STATS);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const profile = await getProfileForUser<{ agency_id: string | null }>(user.id, 'agency_id');
        const agencyId = profile?.agency_id;
        if (!agencyId) { setLoading(false); return; }

        const { data: clients } = await supabase
          .from('clients').select('id').eq('agency_id', agencyId).is('deleted_at', null);
        const clientIds = (clients ?? []).map((c) => c.id);

        const [scheduledRes, publishedRes, pendingRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).in('client_id', clientIds).eq('status', 'Scheduled'),
          supabase.from('posts').select('id', { count: 'exact', head: true }).in('client_id', clientIds).eq('status', 'Published'),
          supabase.from('posts').select('id', { count: 'exact', head: true }).in('client_id', clientIds).eq('status', 'Pending_Approval'),
        ]);

        setStats([
          { label: 'Active Clients',  value: String(clientIds.length),         icon: Users,      color: 'text-blue-500',   bg: 'bg-blue-50' },
          { label: 'Scheduled Posts', value: String(scheduledRes.count ?? 0),  icon: FileText,   color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Published Posts', value: String(publishedRes.count ?? 0),  icon: TrendingUp, color: 'text-green-500',  bg: 'bg-green-50' },
          { label: 'Pending Actions', value: String(pendingRes.count ?? 0),    icon: Zap,        color: 'text-orange-500', bg: 'bg-orange-50' },
        ]);

        if (clientIds.length > 0) {
          const { data: recentPosts } = await supabase
            .from('posts')
            .select('platform, status, updated_at, clients(company_name)')
            .in('client_id', clientIds)
            .order('updated_at', { ascending: false })
            .limit(5);

          setActivities(
            (recentPosts ?? []).map((p) => {
              const client = (p as any).clients?.company_name ? ` for ${(p as any).clients.company_name}` : '';
              return {
                icon: PLATFORM_EMOJI[p.platform ?? ''] ?? '📝',
                text: `${p.platform} post ${STATUS_VERB[p.status ?? ''] ?? 'updated'}${client}`,
                time: formatAgo(new Date(p.updated_at)),
              };
            })
          );
        }
      } catch (e) {
        console.error('Overview fetch failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${s.bg}`}>
                  <s.icon className={s.color} size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground">{loading ? '—' : s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-2">Loading activity…</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No recent activity yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {activities.map((a, i) => (
                <li key={i} className="py-3 flex items-start gap-3">
                  <span className="text-lg">{a.icon}</span>
                  <div>
                    <p className="text-sm text-foreground">{a.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
