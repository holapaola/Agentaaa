import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useOnboard } from "../OnboardContext";
import { AGE_RANGES } from "@/lib/clientProfileOptions";

export default function Step4_Audience() {
  const { audienceType, setAudienceType, targetAgeRange, setTargetAgeRange, targetDescription, setTargetDescription } = useOnboard();
  return (
    <motion.div key="audience" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <div>
        <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-body">
          <Users className="w-4 h-4" /> Who are your customers?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "B2C" as const, label: "B2C — Consumers", desc: "You sell directly to individuals" },
            { id: "B2B" as const, label: "B2B — Businesses", desc: "You sell to other companies" },
          ].map((t) => (
            <button key={t.id} onClick={() => setAudienceType(t.id)}
              className={`p-4 rounded-lg border text-left transition-all ${
                audienceType === t.id ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-muted-foreground/30"
              }`}>
              <div className={`font-display font-semibold text-sm ${audienceType === t.id ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</div>
              <div className="text-xs text-muted-foreground mt-1 font-body">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-3 block font-body">What age group are you targeting? *</label>
        <div className="space-y-2">
          {AGE_RANGES.map((a) => (
            <button key={a.id} onClick={() => setTargetAgeRange(a.id)}
              className={`w-full p-3.5 rounded-lg border text-left transition-all flex justify-between items-center ${
                targetAgeRange === a.id ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-muted-foreground/30"
              }`}>
              <span className={`font-display font-semibold text-sm ${targetAgeRange === a.id ? "text-foreground" : "text-muted-foreground"}`}>{a.id}</span>
              <span className="text-xs text-muted-foreground font-body">{a.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-2 block font-body">Describe your ideal customer (optional)</label>
        <Textarea value={targetDescription} onChange={(e) => setTargetDescription(e.target.value)}
          placeholder="Busy moms aged 28–40 who want quick healthy meal ideas and want to feel confident..."
          className="bg-secondary border-border font-body resize-none" rows={2} />
      </div>
    </motion.div>
  );
}
