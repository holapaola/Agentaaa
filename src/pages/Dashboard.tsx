import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import StatsBar from "@/components/StatsBar";
import Overview from "@/components/dashboard/Overview";
import ContentCalendar from "@/components/dashboard/ContentCalendar";
import Settings from "@/components/dashboard/Settings";
import ContentStudio from "@/components/dashboard/ContentStudio";
import AnalyticsHub from "@/components/dashboard/AnalyticsHub";
import ClientsHub from "@/components/dashboard/ClientsHub";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Tab = "studio" | "clients" | "overview" | "calendar" | "analytics" | "settings";

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: "studio",    label: "Content Studio", emoji: "✨" },
  { id: "clients",   label: "Clients",        emoji: "👥" },
  { id: "overview",  label: "Overview",       emoji: "🏠" },
  { id: "calendar",  label: "Calendar",       emoji: "📅" },
  { id: "analytics", label: "Analytics",      emoji: "📊" },
  { id: "settings",  label: "Settings",       emoji: "⚙️" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("studio");
  const [studioClient, setStudioClient] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchPending = async () => {
      const { data: profile } = await supabase.from("profiles").select("agency_id").eq("id", user.id).single();
      if (!profile?.agency_id) return;
      const { data: clients } = await supabase.from("clients").select("id").eq("agency_id", profile.agency_id);
      if (!clients?.length) return;
      const { count } = await supabase.from("posts")
        .select("id", { count: "exact", head: true })
        .in("client_id", clients.map((c) => c.id))
        .eq("status", "Pending_Approval");
      setPendingCount(count ?? 0);
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  function openStudioForClient(client: any) {
    setStudioClient(client);
    setActiveTab("studio");
  }

  const renderContent = () => {
    switch (activeTab) {
      case "studio":
        return <ContentStudio clientOverride={studioClient} />;
      case "clients":
        return <ClientsHub onCreateContent={openStudioForClient} />;
      case "overview":   return <Overview />;
      case "calendar":   return <ContentCalendar />;
      case "analytics":  return <AnalyticsHub />;
      case "settings":   return <Settings />;
      default:           return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader pendingCount={pendingCount} onBellClick={() => setActiveTab("studio")} />
      <div className="flex flex-1">
        <aside className="w-56 border-r border-border bg-card shrink-0">
          <nav className="p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
                {tab.id === "studio" && pendingCount > 0 && (
                  <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 rounded-full px-1.5 py-0.5 font-bold">{pendingCount}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <StatsBar />
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
