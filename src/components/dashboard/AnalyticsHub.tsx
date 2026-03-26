import { useState } from "react";
import StatsSection from "@/components/analytics/StatsSection";
import ClientStatsSection from "@/components/analytics/ClientStatsSection";
import TrendSection from "@/components/analytics/TrendSection";
import AIToolsSection from "@/components/analytics/AIToolsSection";
import VideoSection from "@/components/analytics/VideoSection";

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
