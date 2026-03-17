import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PaymentCancel = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-3xl font-display font-bold mb-3">No worries!</h1>
        <p className="text-muted-foreground font-body mb-8">
          Your checkout was cancelled. Come back whenever you're ready — your 7-day free trial will be waiting.
        </p>
        <Button asChild variant="outline" size="lg" className="h-12 px-8 font-display">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default PaymentCancel;
