import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { OnboardProvider, useOnboard } from "./onboarding/OnboardContext";
import OnboardLoadingScreen from "./onboarding/OnboardLoadingScreen";
import Step0_Company from "./onboarding/steps/Step0_Company";
import Step1_Industry from "./onboarding/steps/Step1_Industry";
import Step2_Platforms from "./onboarding/steps/Step2_Platforms";
import Step3_Voice from "./onboarding/steps/Step3_Voice";
import Step4_Audience from "./onboarding/steps/Step4_Audience";
import Step5_Content from "./onboarding/steps/Step5_Content";
import Step6_Review from "./onboarding/steps/Step6_Review";

const TOTAL_STEPS = 7;

const stepLabels = ["Company", "Industry", "Platforms", "Voice", "Audience", "Content", "Review"];
const headings = ["Tell us about your business", "Select your industry", "Platforms & goals", "Choose your brand voice", "Who's your audience?", "Content style & frequency", "Review & Create"];
const subtitles = ["We'll use this to personalize your content.", "This helps us find relevant trends.", "The agents will tailor content for each platform.", "How should your content sound?", "The agents will write for your specific audience.", "This shapes how many posts we create and in what style.", "Everything look good?"];

const STEP_COMPONENTS = [
  Step0_Company,
  Step1_Industry,
  Step2_Platforms,
  Step3_Voice,
  Step4_Audience,
  Step5_Content,
  Step6_Review,
];

function OnboardWizard() {
  const { step, canNext, handleNext, handleBack, handleSubmit, isLoading, isDone, loadingMsg } = useOnboard();

  if (isLoading || isDone) {
    return <OnboardLoadingScreen isLoading={isLoading} isDone={isDone} loadingMsg={loadingMsg} />;
  }

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 font-body">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-semibold transition-colors ${
                i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-secondary text-muted-foreground"
              }`}>{i < step ? "✓" : i + 1}</div>
              <span className={`text-xs font-body hidden sm:inline ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {i < stepLabels.length - 1 && <div className={`w-4 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-display font-bold mb-2">{headings[step]}</h2>
        <p className="text-muted-foreground mb-8 font-body text-sm">{subtitles[step]}</p>

        <AnimatePresence mode="wait">
          <StepComponent key={step} />
        </AnimatePresence>

        <div className="flex justify-between mt-10">
          <Button variant="outline" onClick={handleBack} disabled={step === 0} className="font-display">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext} disabled={!canNext} className="font-display">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading} className="font-display glow-gold">
              <Sparkles className="w-4 h-4 mr-2" /> {isLoading ? "Creating..." : "Create Client"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const Onboard = () => (
  <OnboardProvider>
    <OnboardWizard />
  </OnboardProvider>
);

export default Onboard;
