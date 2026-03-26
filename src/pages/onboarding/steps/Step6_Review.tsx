import { motion } from "framer-motion";
import { useOnboard } from "../OnboardContext";

export default function Step6_Review() {
  const {
    companyName, websiteUrl, businessDescription, industry,
    platforms, campaignGoal, brandVoice, audienceType,
    targetAgeRange, targetDescription, contentTypes, postingFrequency,
  } = useOnboard();

  const items = [
    { label: "Company", value: companyName },
    { label: "Website", value: websiteUrl || "—" },
    { label: "Description", value: businessDescription || "—" },
    { label: "Industry", value: industry.join(", ") || "—" },
    { label: "Platforms", value: platforms.join(", ") || "—" },
    { label: "Goal", value: campaignGoal },
    { label: "Brand Voice", value: brandVoice },
    { label: "Audience", value: audienceType ? `${audienceType} · ${targetAgeRange}` : "—" },
    { label: "Ideal Customer", value: targetDescription || "—" },
    { label: "Content Types", value: contentTypes.join(", ") || "—" },
    { label: "Post Frequency", value: postingFrequency || "—" },
  ];

  return (
    <motion.div key="review" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between items-start py-3 border-b border-border/50 gap-4">
          <span className="text-muted-foreground text-sm font-body shrink-0">{item.label}</span>
          <span className="font-display font-medium text-sm text-right">{item.value}</span>
        </div>
      ))}
    </motion.div>
  );
}
