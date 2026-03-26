import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Hash } from "lucide-react";

const trends = [
  { tag: "#AIMarketing",      volume: "24.5K", change: 18 },
  { tag: "#BrandStrategy",    volume: "18.2K", change: 12 },
  { tag: "#ContentCreator",   volume: "42.1K", change: -3 },
  { tag: "#SocialMediaTips",  volume: "31.8K", change: 7 },
  { tag: "#DigitalAgency",    volume: "9.4K",  change: 24 },
  { tag: "#GrowthHacking",    volume: "15.6K", change: 0 },
];

export default function TrendSection() {
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
