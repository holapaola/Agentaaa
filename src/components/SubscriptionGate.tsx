import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { NO_PLANS_MODE } from "@/lib/appMode";

interface Props {
  children: ReactNode;
  featureName?: string;
}

/**
 * Wraps any agent feature. If the user has no active subscription,
 * shows an upgrade prompt instead of the feature.
 */
const SubscriptionGate = ({ children, featureName = "this feature" }: Props) => {
  const { isActive, loading } = useSubscription();

  if (NO_PLANS_MODE) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-body">
        Checking subscription…
      </div>
    );
  }

  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-display font-bold text-lg">Access Setup Required</h3>
        <p className="text-sm text-muted-foreground font-body max-w-xs">
          {featureName} is currently unavailable until access setup is complete.
        </p>
        <Button asChild className="glow-gold font-display">
          <Link to="/mock-checkout">
            <Sparkles className="w-4 h-4 mr-2" />
            Continue
          </Link>
        </Button>
      </motion.div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;
