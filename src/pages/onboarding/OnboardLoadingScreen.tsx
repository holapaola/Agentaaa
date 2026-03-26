import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  isLoading: boolean;
  isDone: boolean;
  loadingMsg: string;
}

export default function OnboardLoadingScreen({ isLoading, isDone, loadingMsg }: Props) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        {isLoading && !isDone ? (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-display font-bold mb-2">Agent AAA is Launching</h2>
            <p className="text-muted-foreground font-body">{loadingMsg}</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-6" />
            <h2 className="text-2xl font-display font-bold mb-2">Swarm Launched!</h2>
            <p className="text-muted-foreground font-body">Taking you to your dashboard...</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
