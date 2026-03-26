import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useOnboard } from "../OnboardContext";
import { CONTENT_TYPES, POSTING_FREQS } from "@/lib/clientProfileOptions";

export default function Step5_Content() {
  const { contentTypes, toggleContentType, postingFrequency, setPostingFrequency } = useOnboard();
  return (
    <motion.div key="content" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <div>
        <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-body">
          <FileText className="w-4 h-4" /> What types of content work best for you? (pick all that apply)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CONTENT_TYPES.map((ct) => (
            <button key={ct.id} onClick={() => toggleContentType(ct.id)}
              className={`p-3 rounded-lg border text-left font-body text-sm transition-all flex items-center gap-2 ${
                contentTypes.includes(ct.id) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30"
              }`}>
              <span>{ct.emoji}</span> {ct.id}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-3 block font-body">How often do you want to post?</label>
        <div className="space-y-2">
          {POSTING_FREQS.map((f) => (
            <button key={f.id} onClick={() => setPostingFrequency(f.id)}
              className={`w-full p-3.5 rounded-lg border text-left transition-all flex justify-between items-center ${
                postingFrequency === f.id ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-muted-foreground/30"
              }`}>
              <span className={`font-display font-semibold text-sm ${postingFrequency === f.id ? "text-foreground" : "text-muted-foreground"}`}>{f.id}</span>
              <span className="text-xs text-muted-foreground font-body">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
