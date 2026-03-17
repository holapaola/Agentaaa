import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { redirectToCheckout, type Plan } from "@/services/stripeService";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "Perfect for small businesses & solo operators",
    badge: null,
    plan: "starter" as Plan,
    features: [
      "1 Client Profile",
      "3 Social Accounts",
      "30 AI Posts/month",
      "Full Agent Swarm (Research → Schedule)",
      "One-Click Approval Workflow",
      "Basic Analytics",
      "Email Support",
    ],
    highlighted: false,
    cta: "Start Free Trial",
  },
  {
    name: "Agency",
    price: "$149",
    period: "/mo",
    description: "For agencies managing multiple clients on autopilot",
    badge: "Most Popular",
    plan: "agency" as Plan,
    features: [
      "Up to 10 Client Profiles",
      "Unlimited Social Accounts",
      "Unlimited AI Posts",
      "Full Agent Swarm per Client",
      "White-label Reports",
      "Custom Brand Voice per Client",
      "Advanced Analytics",
      "Priority Support",
      "Team Collaboration",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "$349",
    period: "/mo",
    description: "Unlimited scale for high-volume agencies",
    badge: null,
    plan: "enterprise" as Plan,
    features: [
      "Unlimited Client Profiles",
      "Unlimited Social Accounts",
      "Unlimited AI Posts",
      "Dedicated AI Agent Instance",
      "API Access",
      "Custom Integrations",
      "White-label Dashboard",
      "SLA & Dedicated Support",
    ],
    highlighted: false,
    cta: "Start Free Trial",
  },
];

const PricingSection = () => {
  const [loading, setLoading] = useState<Plan | null>(null);
  const { toast } = useToast();

  const handleCheckout = async (plan: Plan) => {
    try {
      setLoading(plan);
      await redirectToCheckout(plan);
    } catch {
      toast({ title: "Something went wrong", description: "Please try again or contact support.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="py-32 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-6"
        >
          <span className="text-primary text-sm font-display font-semibold tracking-widest uppercase">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4">
            Choose Your <span className="text-gradient-gold">Plan</span>
          </h2>
        </motion.div>

        {/* Free trial banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-16"
        >
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground font-body">
            All plans include a <span className="text-primary font-semibold">7-day free trial</span> — no credit card required
          </span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`glass-card rounded-2xl p-8 relative flex flex-col ${plan.highlighted ? "border-primary ring-1 ring-primary/20 glow-gold" : ""}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-display font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <h3 className="font-display font-bold text-xl">{plan.name}</h3>
              <p className="text-sm text-muted-foreground font-body mt-1">{plan.description}</p>
              <div className="mt-6 mb-2">
                <span className="text-4xl font-display font-bold text-primary">{plan.price}</span>
                <span className="text-muted-foreground font-body">{plan.period}</span>
              </div>
              <p className="text-xs text-primary font-body mb-6">7 days free, then billed monthly</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-body text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleCheckout(plan.plan)}
                disabled={loading === plan.plan}
                className={`w-full h-12 font-display ${plan.highlighted ? "glow-gold" : ""}`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {loading === plan.plan
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</>
                  : <>{plan.cta} <ArrowRight className="w-4 h-4 ml-2" /></>
                }
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-10 font-body"
        >
          Cancel anytime. No hidden fees. Replaces a $5,000/month human agency.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
