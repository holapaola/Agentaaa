import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOnboard } from "../OnboardContext";

export default function Step0_Company() {
  const { companyName, setCompanyName, websiteUrl, setWebsiteUrl, businessDescription, setBusinessDescription } = useOnboard();
  return (
    <motion.div key="company" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div>
        <label className="text-sm text-muted-foreground mb-2 block font-body">Company Name *</label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
          placeholder="The Local Gym" className="h-14 text-lg bg-secondary border-border font-body" />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-2 block font-body">Website URL (optional)</label>
        <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://thelocalgym.com" className="h-14 text-lg bg-secondary border-border font-body" />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-2 block font-body">What do you do? (optional)</label>
        <Textarea value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)}
          placeholder="We're a fitness gym helping everyday people build strength and confidence..."
          className="bg-secondary border-border font-body resize-none" rows={3} />
      </div>
    </motion.div>
  );
}
