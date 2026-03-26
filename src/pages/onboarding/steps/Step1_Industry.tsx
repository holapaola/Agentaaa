import { motion } from "framer-motion";
import { useOnboard } from "../OnboardContext";
import { INDUSTRY_CATEGORIES } from "@/lib/clientProfileOptions";

export default function Step1_Industry() {
  const { industryCategory, setIndustryCategory, industry, toggleIndustry } = useOnboard();
  return (
    <motion.div key="industry" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {INDUSTRY_CATEGORIES.map((cat) => {
          const pickedCount = cat.subs.filter((s) => industry.includes(s)).length;
          return (
            <button key={cat.label}
              onClick={() => setIndustryCategory(cat.label)}
              className={`px-3 py-2 rounded-lg border text-sm font-body transition-all flex items-center gap-1.5 ${
                industryCategory === cat.label
                  ? "border-primary bg-primary/10 text-foreground"
                  : pickedCount > 0
                  ? "border-primary/50 bg-primary/5 text-foreground"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30"
              }`}>
              <span>{cat.emoji}</span> {cat.label}
              {pickedCount > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-display font-bold">{pickedCount}</span>
              )}
            </button>
          );
        })}
      </div>
      {industryCategory && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-2 pt-2">
          <div className="col-span-2 flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-body">
              Pick your niche in <span className="text-foreground font-semibold">{industryCategory}</span>:
            </p>
            <span className={`text-xs font-display font-semibold px-2 py-0.5 rounded-full ${
              industry.length >= 3 ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            }`}>{industry.length}/10 selected {industry.length >= 3 ? "✓" : "(pick at least 3)"}</span>
          </div>
          {INDUSTRY_CATEGORIES.find((c) => c.label === industryCategory)?.subs.map((sub) => {
            const selected = industry.includes(sub);
            const maxed = industry.length >= 10 && !selected;
            return (
              <button key={sub} onClick={() => toggleIndustry(sub)} disabled={maxed}
                className={`p-3 rounded-lg border text-left font-body text-sm transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : maxed
                    ? "border-border bg-secondary/20 text-muted-foreground/40 cursor-not-allowed"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30"
                }`}>
                {selected && <span className="mr-1">✓</span>}{sub}
              </button>
            );
          })}
        </motion.div>
      )}
      {!industryCategory && (
        <p className="text-xs text-muted-foreground font-body pt-1">👆 Pick a category above to see options</p>
      )}
    </motion.div>
  );
}
