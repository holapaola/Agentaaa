import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { launchClientPipeline } from "@/services/agentService";

export interface OnboardState {
  // Step 0
  companyName: string;
  setCompanyName: (v: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;
  businessDescription: string;
  setBusinessDescription: (v: string) => void;
  // Step 1
  industryCategory: string;
  setIndustryCategory: (v: string) => void;
  industry: string[];
  toggleIndustry: (sub: string) => void;
  // Step 2
  platforms: string[];
  togglePlatform: (p: string) => void;
  campaignGoal: string;
  setCampaignGoal: (v: string) => void;
  // Step 3
  brandVoice: string;
  setBrandVoice: (v: string) => void;
  // Step 4
  audienceType: "B2B" | "B2C" | "";
  setAudienceType: (v: "B2B" | "B2C" | "") => void;
  targetAgeRange: string;
  setTargetAgeRange: (v: string) => void;
  targetDescription: string;
  setTargetDescription: (v: string) => void;
  // Step 5
  contentTypes: string[];
  toggleContentType: (ct: string) => void;
  postingFrequency: string;
  setPostingFrequency: (v: string) => void;
  // Navigation
  step: number;
  canNext: boolean;
  handleNext: () => void;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;
  // UI state
  isLoading: boolean;
  isDone: boolean;
  loadingMsg: string;
}

const OnboardContext = createContext<OnboardState | null>(null);

export function OnboardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [industryCategory, setIndustryCategory] = useState("");
  const [industry, setIndustry] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [campaignGoal, setCampaignGoal] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [audienceType, setAudienceType] = useState<"B2B" | "B2C" | "">("");
  const [targetAgeRange, setTargetAgeRange] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [postingFrequency, setPostingFrequency] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Setting up your agency...");

  const navigate = useNavigate();
  const { user } = useAuth();

  const toggleIndustry = (sub: string) =>
    setIndustry((prev) =>
      prev.includes(sub) ? prev.filter((x) => x !== sub) : prev.length < 10 ? [...prev, sub] : prev
    );

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const toggleContentType = (ct: string) =>
    setContentTypes((prev) => prev.includes(ct) ? prev.filter((x) => x !== ct) : [...prev, ct]);

  const canNext =
    (step === 0 && companyName.trim().length > 0) ||
    (step === 1 && industry.length >= 3) ||
    (step === 2 && platforms.length > 0 && campaignGoal.length > 0) ||
    (step === 3 && brandVoice.length > 0) ||
    (step === 4 && audienceType.length > 0 && targetAgeRange.length > 0) ||
    (step === 5 && contentTypes.length > 0 && postingFrequency.length > 0) ||
    step === 6;

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in before finishing onboarding.");
      return;
    }
    setIsLoading(true);
    try {
      setLoadingMsg("Setting up your agency...");
      let agencyId: string;
      const { data: existingAgency } = await supabase
        .from("agencies").select("id").eq("user_id", user.id).maybeSingle();

      if (existingAgency) {
        agencyId = existingAgency.id;
      } else {
        const { data: newAgency, error: agencyErr } = await supabase
          .from("agencies")
          .insert({ user_id: user.id, agency_name: `${companyName}'s Agency` })
          .select("id").single();
        if (agencyErr || !newAgency) throw agencyErr ?? new Error("Failed to create agency");
        agencyId = newAgency.id;
      }

      setLoadingMsg(`Registering ${companyName}...`);
      const { data: client, error: clientErr } = await supabase
        .from("clients")
        .insert({
          agency_id: agencyId,
          company_name: companyName,
          website_url: websiteUrl || null,
          business_description: businessDescription || null,
          industry: industry.join(', '),
          brand_voice: brandVoice,
          platforms,
          campaign_goal: campaignGoal,
          target_audience_type: audienceType || null,
          target_age_range: targetAgeRange || null,
          target_description: targetDescription || null,
          content_types: contentTypes,
          posting_frequency: postingFrequency || null,
          pipeline_status: "Researching",
        })
        .select("id").single();
      if (clientErr || !client) throw clientErr ?? new Error("Failed to create client");

      setLoadingMsg("Starting your workforce...");
      await launchClientPipeline(client.id);

      setIsDone(true);
      setLoadingMsg("Profile saved! Taking you to your dashboard...");
      toast.success(`${companyName} is ready. Your workforce is getting started.`);
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err: unknown) {
      console.error("Onboard error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoadingMsg("Something went wrong. Please try again.");
      setTimeout(() => { setIsLoading(false); setLoadingMsg("Setting up your agency..."); }, 2000);
    }
  };

  return (
    <OnboardContext.Provider value={{
      companyName, setCompanyName,
      websiteUrl, setWebsiteUrl,
      businessDescription, setBusinessDescription,
      industryCategory, setIndustryCategory,
      industry, toggleIndustry,
      platforms, togglePlatform,
      campaignGoal, setCampaignGoal,
      brandVoice, setBrandVoice,
      audienceType, setAudienceType,
      targetAgeRange, setTargetAgeRange,
      targetDescription, setTargetDescription,
      contentTypes, toggleContentType,
      postingFrequency, setPostingFrequency,
      step, canNext, handleNext, handleBack, handleSubmit,
      isLoading, isDone, loadingMsg,
    }}>
      {children}
    </OnboardContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOnboard(): OnboardState {
  const ctx = useContext(OnboardContext);
  if (!ctx) throw new Error("useOnboard must be used within OnboardProvider");
  return ctx;
}
