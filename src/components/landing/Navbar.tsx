import { Link } from "react-router-dom";
import { Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-lg tracking-tight">Agent AAA</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="font-display text-sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" className="font-display text-sm" onClick={signOut}>
                <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="font-display text-sm">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="font-display text-sm">
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
