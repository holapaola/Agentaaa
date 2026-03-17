import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Instagram, Twitter, Linkedin, Facebook, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Colors assigned to clients in the global calendar
const CLIENT_COLORS = [
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-fuchsia-500',
  'bg-lime-500',
  'bg-indigo-500',
];

const CLIENT_COLORS_HEX = [
  '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4',
  '#f97316', '#14b8a6', '#d946ef', '#84cc16', '#6366f1',
];

const PLATFORM_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  Instagram:     { color: 'bg-pink-500',   icon: <Instagram className="w-3 h-3" /> },
  'Twitter / X': { color: 'bg-sky-500',    icon: <Twitter className="w-3 h-3" /> },
  LinkedIn:      { color: 'bg-blue-600',   icon: <Linkedin className="w-3 h-3" /> },
  Facebook:      { color: 'bg-blue-500',   icon: <Facebook className="w-3 h-3" /> },
  TikTok:        { color: 'bg-pink-400',   icon: <Music className="w-3 h-3" /> },
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function ContentCalendar({ clientId }: { clientId?: string }) {
  const { user } = useAuth();
  const isGlobal = !clientId;
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [postsByDay, setPostsByDay] = useState<Record<string, any[]>>({});
  const [clientColorMap, setClientColorMap] = useState<Record<string, { color: string; name: string }>>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1).toISOString();
    const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59).toISOString();

    supabase
      .from('agencies')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(async ({ data: agency }) => {
        if (!agency) { setLoading(false); return; }

        // Build client color map for global view
        if (isGlobal) {
          const { data: clients } = await supabase
            .from('clients')
            .select('id, company_name')
            .eq('agency_id', agency.id)
            .order('created_at', { ascending: true });
          const map: Record<string, { color: string; name: string }> = {};
          (clients ?? []).forEach((c, i) => {
            map[c.id] = { color: CLIENT_COLORS[i % CLIENT_COLORS.length], name: c.company_name };
          });
          setClientColorMap(map);
        }

        let query = supabase
          .from('posts')
          .select('*, clients(company_name)')
          .in('status', ['Scheduled', 'Approved'])
          .not('scheduled_at', 'is', null)
          .gte('scheduled_at', startOfMonth)
          .lte('scheduled_at', endOfMonth);

        if (clientId) query = query.eq('client_id', clientId);

        const { data } = await query;
        const map: Record<string, any[]> = {};
        (data ?? []).forEach((post) => {
          const key = toDateKey(new Date(post.scheduled_at));
          if (!map[key]) map[key] = [];
            map[key].push(post);
          });
          setPostsByDay(map);
          setLoading(false);
        });
  }, [user?.id, current.getFullYear(), current.getMonth(), clientId]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const totalDays = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => { setCurrent(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrent(new Date(year, month + 1, 1)); setSelectedDay(null); };

  const monthLabel = current.toLocaleString('default', { month: 'long', year: 'numeric' });

  const selectedPosts = selectedDay ? (postsByDay[selectedDay] ?? []) : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl">Calendar</h2>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-semibold text-sm w-36 text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-display font-semibold text-muted-foreground py-2 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-background/30 min-h-[80px]" />;
          }
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const posts = postsByDay[key] ?? [];
          const isToday = toDateKey(today) === key;
          const isSelected = selectedDay === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(isSelected ? null : key)}
              className={`bg-background min-h-[80px] p-2 text-left transition-colors hover:bg-secondary/60 flex flex-col gap-1 ${
                isSelected ? 'ring-2 ring-inset ring-primary' : ''
              }`}
            >
              <span className={`text-xs font-display font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}>
                {day}
              </span>
              <div className="flex flex-wrap gap-1 mt-auto">
                {posts.slice(0, 4).map((p, i) => {
                  const dotColor = isGlobal
                    ? (clientColorMap[p.client_id]?.color ?? 'bg-muted')
                    : (PLATFORM_STYLE[p.platform ?? '']?.color ?? 'bg-muted');
                  const label = isGlobal
                    ? `${p.clients?.company_name} · ${p.platform}`
                    : `${p.platform}`;
                  return (
                    <span key={i} className={`w-2.5 h-2.5 rounded-full ${dotColor}`} title={label} />
                  );
                })}
                {posts.length > 4 && (
                  <span className="text-[10px] text-muted-foreground font-body">+{posts.length - 4}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground font-body text-center py-4">Loading posts…</p>
      )}

      {/* Day detail panel */}
      {selectedDay && (
        <div className="border border-border rounded-xl bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
              <span className="ml-2 text-muted-foreground font-body font-normal">
                {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">No scheduled posts for this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedPosts.map((post) => {
                const platformStyle = PLATFORM_STYLE[post.platform ?? ''] ?? { color: 'bg-muted', icon: null };
                const clientColor = isGlobal ? (clientColorMap[post.client_id]?.color ?? 'bg-muted') : platformStyle.color;
                return (
                  <div key={post.id} className="flex gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                    {/* Left accent: client color (global) or platform color (single client) */}
                    <div className={`mt-0.5 w-1.5 rounded-full flex-shrink-0 self-stretch ${clientColor}`} />
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0 ${platformStyle.color}`}>
                      {platformStyle.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-display font-semibold">{post.platform}</span>
                        {post.clients?.company_name && (
                          <span className="text-xs text-muted-foreground font-body">· {post.clients.company_name}</span>
                        )}
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-body">
                          {post.status}
                        </span>
                      </div>
                      <p className="text-sm font-body text-foreground leading-relaxed line-clamp-3">
                        {post.caption_text}
                      </p>
                      {post.ai_visual_prompt && (
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          🎨 {post.ai_visual_prompt}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {isGlobal ? (
        // Global: show client colors
        Object.keys(clientColorMap).length > 0 && (
          <div className="flex flex-wrap gap-4 pt-2">
            {Object.entries(clientColorMap).map(([id, { color, name }]) => (
              <div key={id} className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {name}
              </div>
            ))}
          </div>
        )
      ) : (
        // Single client: show platform colors
        <div className="flex flex-wrap gap-4 pt-2">
          {Object.entries(PLATFORM_STYLE).map(([name, s]) => (
            <div key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
              <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

