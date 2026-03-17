import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface MetricBar {
  label: string;
  value: number;
  max: number;
  color: string;
}

const platforms = [
  { name: 'Instagram', emoji: '📸', impressions: 42_300, reach: 31_100, engagements: 2_840, followers: 8_200 },
  { name: 'Twitter / X', emoji: '🐦', impressions: 28_100, reach: 18_500, engagements: 1_430, followers: 3_750 },
  { name: 'LinkedIn', emoji: '💼', impressions: 13_800, reach: 10_200, engagements: 890, followers: 2_100 },
];

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function BarRow({ label, value, max, color }: MetricBar) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right font-medium text-foreground">{formatNumber(value)}</span>
    </div>
  );
}

export default function Analytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((p) => (
          <Card key={p.name}>
            <CardHeader>
              <CardTitle>{p.emoji} {p.name}</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <BarRow label="Impressions" value={p.impressions} max={50_000} color="bg-blue-400" />
              <BarRow label="Reach" value={p.reach} max={50_000} color="bg-purple-400" />
              <BarRow label="Engagements" value={p.engagements} max={5_000} color="bg-green-400" />
              <BarRow label="Followers" value={p.followers} max={10_000} color="bg-orange-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
