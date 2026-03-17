import { TrendingUp, TrendingDown, Minus, Hash } from "lucide-react";

interface Trend {
  tag: string;
  volume: string;
  change: number;
}

const trends: Trend[] = [
  { tag: "#AIMarketing", volume: "24.5K", change: 18 },
  { tag: "#BrandStrategy", volume: "18.2K", change: 12 },
  { tag: "#ContentCreator", volume: "42.1K", change: -3 },
  { tag: "#SocialMediaTips", volume: "31.8K", change: 7 },
  { tag: "#DigitalAgency", volume: "9.4K", change: 24 },
  { tag: "#GrowthHacking", volume: "15.6K", change: 0 },
];

export default function TrendsPanel() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Trending Now</h2>
      <div className="space-y-1">
        {trends.map((trend, i) => {
          const isUp = trend.change > 0;
          const isDown = trend.change < 0;
          return (
            <div
              key={trend.tag}
              className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-secondary/60 "
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{trend.tag.slice(1)}</p>
                  <p className="text-xs text-muted-foreground">{trend.volume} posts</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                isUp ? "text-green-500" : isDown ? "text-red-500" : "text-gray-500"
              }`}>
                {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : isDown ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                {Math.abs(trend.change)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
