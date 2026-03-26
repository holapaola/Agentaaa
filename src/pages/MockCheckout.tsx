import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MockCheckout = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center glass-card rounded-2xl p-10"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-lg">AgentAAA</span>
          </div>

          <h1 className="text-3xl font-display font-bold mb-2">
            Everything is <span className="text-gradient-gold">Unlocked</span>
          </h1>

          <p className="text-muted-foreground font-body mb-8">
            Plans are temporarily disabled while we finish the product, so you can use the full app without checkout.
          </p>

          <div className="space-y-3 text-sm text-muted-foreground font-body mb-8 text-left">
            <p>- No subscription is required right now.</p>
            <p>- Client creation, content tools, and social account management stay available.</p>
            <p>- We can add plans back later once the product flow is stable.</p>
          </div>

          <Button asChild className="w-full h-12 font-display text-base glow-gold">
            <Link to="/onboard">
              Continue to setup <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default MockCheckout;
