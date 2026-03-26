import { motion } from "framer-motion";
import { Briefcase, Mic, Globe, Sparkles, Target, Users } from "lucide-react";
import { useOnboard } from "../OnboardContext";
import { BRAND_VOICES } from "@/lib/clientProfileOptions";

const brandVoiceIcons = {
  Professional: Briefcase,
  Witty: Mic,
  Energetic: Sparkles,
  Minimalist: Globe,
  Inspiring: Target,
  "Casual & Friendly": Users,
} as const;

export default function Step3_Voice() {
  const { brandVoice, setBrandVoice } = useOnboard();
  return (
    <motion.div key="voice" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="grid grid-cols-2 gap-3">
      {BRAND_VOICES.map((voice) => (
        <button key={voice.label} onClick={() => setBrandVoice(voice.label)}
          className={`p-5 rounded-lg border text-left transition-all ${
            brandVoice === voice.label ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-muted-foreground/30"
          }`}>
          {(() => {
            const Icon = brandVoiceIcons[voice.label as keyof typeof brandVoiceIcons];
            return Icon ? <Icon className={`w-5 h-5 mb-2 ${brandVoice === voice.label ? "text-primary" : "text-muted-foreground"}`} /> : null;
          })()}
          <div className="font-display font-semibold text-sm">{voice.label}</div>
          <div className="text-xs text-muted-foreground mt-1">{voice.desc}</div>
        </button>
      ))}
    </motion.div>
  );
}
