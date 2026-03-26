import { motion } from "framer-motion";
import { Share2, Target } from "lucide-react";
import { useOnboard } from "../OnboardContext";
import { PLATFORM_OPTIONS as PLATFORMS, GOALS } from "@/lib/clientProfileOptions";

export default function Step2_Platforms() {
  const { platforms, togglePlatform, campaignGoal, setCampaignGoal } = useOnboard();
  return (
    <motion.div key="platforms" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <div>
        <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-body">
          <Share2 className="w-4 h-4" /> Where do you want to post? (pick all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p.id} onClick={() => togglePlatform(p.id)}
              className={`px-4 py-2.5 rounded-lg border text-sm font-body transition-all flex items-center gap-2 ${
                platforms.includes(p.id) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30"
              }`}><span>{p.emoji}</span> {p.id}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-body">
          <Target className="w-4 h-4" /> What's the main goal of this campaign?
        </label>
        <div className="space-y-2">
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => setCampaignGoal(g.id)}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                campaignGoal === g.id ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-muted-foreground/30"
              }`}>
              <div className={`font-display font-semibold text-sm ${campaignGoal === g.id ? "text-foreground" : "text-muted-foreground"}`}>{g.id}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-body">{g.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
