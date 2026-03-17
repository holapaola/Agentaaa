import { FileText, CheckCircle2, Eye, TrendingUp } from "lucide-react";

const stats = [
  { label: "Drafts", value: "12", icon: FileText, color: "text-primary" },
  { label: "Approved", value: "34", icon: CheckCircle2, color: "text-accent" },
  { label: "Reach", value: "128K", icon: Eye, color: "text-muted-foreground" },
  { label: "Engagement", value: "4.2%", icon: TrendingUp, color: "text-green-500" },
];

export default function StatsBar() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-card p-4 "
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-2">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
            <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
