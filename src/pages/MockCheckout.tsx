import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Check, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Plan = "starter" | "agency" | "enterprise";

const plans = [
  {
    id: "starter" as Plan,
    name: "Starter",
    price: "$49/mo",
    features: ["1 Client", "30 AI Posts/month", "Full Agent Swarm"],
  },
  {
    id: "agency" as Plan,
    name: "Agency",
    price: "$149/mo",
    features: ["10 Clients", "Unlimited Posts", "White-label Reports"],
    popular: true,
  },
  {
    id: "enterprise" as Plan,
    name: "Enterprise",
    price: "$349/mo",
    features: ["Unlimited Clients", "API Access", "Dedicated Support"],
  },
];

const MockCheckout = () => {
  const { user } = useAuth();
  const navigate   = useNavigate();
  const { toast }  = useToast();
  const [selected, setSelected]   = useState<Plan>("agency");
  const [loading, setLoading]     = useState(false);

  const handleMockPay = async () => {
    if (!user) { navigate("/auth"); return; }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status:     "trialing",
          subscription_plan:       selected,
          subscription_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "🎉 Trial activated!", description: "7-day free trial started. No real charge made." });
      navigate("/onboard");
    } catch (err: unknown) {
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-lg">AgentAAA</span>
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">
            Start Your <span className="text-gradient-gold">Free Trial</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            7 days free — pick a plan, no credit card required in test mode
          </p>
        </motion.div>

        {/* Plan selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`relative text-left rounded-2xl p-6 border transition-all cursor-pointer ${
                selected === plan.id
                  ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-display font-bold px-3 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold">{plan.name}</span>
                {selected === plan.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="text-xl font-display font-bold text-primary mb-4">{plan.price}</div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground font-body flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </motion.div>

        {/* Mock payment form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-body">
              🧪 <strong>Test Mode</strong> — No real payment will be processed
            </span>
          </div>

          {/* Fake card fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 opacity-50 pointer-events-none select-none">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground font-body mb-1 block">Card Number</label>
              <div className="h-10 rounded-lg border border-border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground font-mono">
                4242 4242 4242 4242
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Expiry</label>
              <div className="h-10 rounded-lg border border-border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground font-mono">
                12 / 27
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">CVC</label>
              <div className="h-10 rounded-lg border border-border bg-muted/30 px-3 flex items-center text-sm text-muted-foreground font-mono">
                •••
              </div>
            </div>
          </div>

          <Button
            onClick={handleMockPay}
            disabled={loading}
            className="w-full h-12 font-display text-base glow-gold"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activating trial...</>
              : <>Activate 7-Day Free Trial — {plans.find(p => p.id === selected)?.price}</>
            }
          </Button>
          <p className="text-center text-xs text-muted-foreground font-body mt-3">
            Cancel anytime. You won't be charged in test mode.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default MockCheckout;
