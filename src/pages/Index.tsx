import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
    </div>
  );
};

export default Index;
