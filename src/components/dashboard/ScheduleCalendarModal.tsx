import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Instagram, Twitter, Linkedin, Facebook, Music, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PLATFORM_COLOR: Record<string, string> = {
  Instagram: 'bg-pink-500',
  'Twitter / X': 'bg-sky-500',
  LinkedIn: 'bg-blue-600',
  Facebook: 'bg-blue-500',
  TikTok: 'bg-pink-400',
};
const PLATFORM_ICON: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="w-3 h-3" />,
  'Twitter / X': <Twitter className="w-3 h-3" />,
  LinkedIn: <Linkedin className="w-3 h-3" />,
  Facebook: <Facebook className="w-3 h-3" />,
  TikTok: <Music className="w-3 h-3" />,
};

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

interface ScheduledPost {
  id: string;
  platform: string | null;
  scheduled_at: string;
  caption_text: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  postPlatform?: string | null;
}

export default function ScheduleCalendarModal({ isOpen, onClose, onConfirm, postPlatform }: Props) {
  const { user } = useAuth();
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [postsByDay, setPostsByDay] = useState<Record<string, ScheduledPost[]>>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState('10');
  const [selectedMinute, setSelectedMinute] = useState('00');

  const year = current.getFullYear();
  const month = current.getMonth();

  useEffect(() => {
    if (!isOpen || !user) return;
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    supabase
      .from('agencies')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(async ({ data: agency }) => {
        if (!agency) return;
        const { data } = await supabase
          .from('posts')
          .select('id, platform, scheduled_at, caption_text')
          .in('status', ['Scheduled', 'Approved'])
          .not('scheduled_at', 'is', null)
          .gte('scheduled_at', start)
          .lte('scheduled_at', end);

        const map: Record<string, ScheduledPost[]> = {};
        (data ?? []).forEach((p) => {
          const key = toDateKey(new Date(p.scheduled_at!));
          if (!map[key]) map[key] = [];
          map[key].push(p as ScheduledPost);
        });
        setPostsByDay(map);
      });
  }, [isOpen, user, year, month]);

  if (!isOpen) return null;

  const totalDays = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = current.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleConfirm = () => {
    if (!selectedDay) return;
    const [y, m, d] = selectedDay.split('-').map(Number);
    const date = new Date(y, m - 1, d, Number(selectedHour), Number(selectedMinute), 0, 0);
    onConfirm(date);
  };

  const todayKey = toDateKey(today);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg space-y-4 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base">Pick a date to schedule</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelectedDay(null); }}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-semibold text-sm">{monthLabel}</span>
          <button
            onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelectedDay(null); }}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-display font-semibold text-muted-foreground py-1 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="bg-background/30 min-h-[52px]" />;

            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const posts = postsByDay[key] ?? [];
            const isToday = todayKey === key;
            const isSelected = selectedDay === key;
            const isPast = new Date(key) < new Date(todayKey);

            return (
              <button
                key={key}
                disabled={isPast}
                onClick={() => !isPast && setSelectedDay(isSelected ? null : key)}
                className={`bg-background min-h-[52px] p-1.5 text-left flex flex-col gap-1 transition-colors
                  ${isPast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-secondary/60 cursor-pointer'}
                  ${isSelected ? 'ring-2 ring-inset ring-primary bg-primary/5' : ''}
                `}
              >
                <span className={`text-[11px] font-display font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}>
                  {day}
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {posts.slice(0, 3).map((p, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${PLATFORM_COLOR[p.platform ?? ''] ?? 'bg-muted'}`}
                      title={`${p.platform} — ${p.caption_text?.slice(0, 40) ?? ''}`}
                    />
                  ))}
                  {posts.length > 3 && (
                    <span className="text-[9px] text-muted-foreground">+{posts.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Time picker — shown when a day is selected */}
        {selectedDay && (
          <div className="flex items-center gap-3 bg-secondary/30 rounded-lg px-4 py-3">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-display font-semibold text-foreground">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="bg-background border border-border rounded-md text-sm px-2 py-1 font-body focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-muted-foreground font-bold">:</span>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(e.target.value)}
                className="bg-background border border-border rounded-md text-sm px-2 py-1 font-body focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {['00', '15', '30', '45'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Platform legend */}
        <div className="flex flex-wrap gap-3">
          {postPlatform && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
              <span className={`w-2.5 h-2.5 rounded-full ${PLATFORM_COLOR[postPlatform] ?? 'bg-primary'} ring-2 ring-primary`} />
              This post ({postPlatform})
            </div>
          )}
          {Object.entries(PLATFORM_COLOR).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-body">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {name}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" className="font-display text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedDay}
            onClick={handleConfirm}
            className="font-display text-xs bg-green-600 hover:bg-green-500 text-white gap-2"
          >
            Schedule for {selectedDay
              ? `${new Date(selectedDay + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })} at ${selectedHour}:${selectedMinute}`
              : '…'}
          </Button>
        </div>
      </div>
    </div>
  );
}
