import { motion } from "framer-motion";
import howDashboard from "@/assets/how-it-works-dashboard.jpg";
import howResearch from "@/assets/how-it-works-research.jpg";
import howApprove from "@/assets/how-it-works-approve.jpg";

const steps = [
  {
    number: "01",
    title: "Onboard Your Brand",
    description: "Tell us about your business, industry, and preferred voice. Our AI instantly researches your brand identity and competitive landscape.",
    image: howResearch,
  },
  {
    number: "02",
    title: "AI Creates Content",
    description: "Agent AAA drafts scroll-stopping posts tailored to trending topics in your industry. Captions, visuals, and scheduling—all automated.",
    image: howDashboard,
  },
  {
    number: "03",
    title: "Approve & Publish",
    description: "Review AI-generated posts in your Action Center. Approve, tweak, or regenerate with one click. You stay in control, zero effort.",
    image: howApprove,
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-sm font-display font-semibold tracking-widest uppercase">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4">
            Three Steps to <span className="text-gradient-gold">Autopilot</span>
          </h2>
        </motion.div>

        <div className="space-y-32">
          {steps.map((step, i) => (
            <div key={step.number} className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-20`}>
              {/* Text */}
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 1 ? 60 : -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex-1 max-w-md"
              >
                <span className="text-5xl font-display font-bold text-primary/20">{step.number}</span>
                <h3 className="text-2xl md:text-3xl font-display font-bold mt-2 mb-4">{step.title}</h3>
                <p className="text-muted-foreground font-body leading-relaxed">{step.description}</p>
              </motion.div>

              {/* Image */}
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 1 ? -60 : 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                className="flex-1"
              >
                <div className="glass-card rounded-2xl overflow-hidden glow-gold">
                  <img src={step.image} alt={step.title} className="w-full h-auto object-cover" loading="lazy" />
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
