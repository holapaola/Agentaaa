import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-display font-bold mb-3">You're in! 🎉</h1>
        <p className="text-muted-foreground font-body mb-2">
          Your 7-day free trial has started. No charge until your trial ends.
        </p>
        <p className="text-sm text-muted-foreground font-body mb-8">
          Let's set up your first client and get your AI agents working.
        </p>
        <Button asChild size="lg" className="h-12 px-8 font-display glow-gold">
          <Link to="/onboard">
            Set Up My First Client <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
