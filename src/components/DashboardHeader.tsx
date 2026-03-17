import { Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Props {
  pendingCount?: number;
  onBellClick?: () => void;
}

export default function DashboardHeader({ pendingCount = 0, onBellClick }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Agent AAA</h1>
      </Link>
      <Button variant="ghost" size="icon" className="relative text-muted-foreground" onClick={onBellClick} title="Pending approvals">
        <Bell className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-yellow-500 text-[10px] font-bold text-black flex items-center justify-center px-1">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </Button>
    </header>
  );
}
