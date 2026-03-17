import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Globe, Mic, Briefcase, Loader2, CheckCircle2, Sparkles, Target, Share2, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const INDUSTRY_CATEGORIES: { label: string; emoji: string; subs: string[] }[] = [
  {
    label: "Arts, Crafts & Handmade", emoji: "🎭",
    subs: ["Mosaic Artist / Workshop", "Pottery & Ceramics", "Painting Classes & Studio", "Jewelry Making", "Candle & Soap Making", "Macramé & Textile", "Woodworking", "Stained Glass", "Resin Art", "Floral Design & Arrangements", "Knitting & Crochet", "Leather Craft", "Printmaking", "Sculpture", "Mixed Media Art"],
  },
  {
    label: "Retail & E-commerce", emoji: "🛍️",
    subs: ["Fashion & Apparel", "Beauty & Skincare", "Health Supplements", "Home & Decor", "Electronics", "Toys & Games", "Pet Products", "Jewelry & Accessories", "Sporting Goods", "Books & Stationery", "Vintage & Thrift", "Subscription Box", "Print on Demand", "Handmade / Etsy Shop"],
  },
  {
    label: "Food & Hospitality", emoji: "🍽️",
    subs: ["Restaurant & Café", "Bar & Nightlife", "Food Truck", "Catering", "Bakery & Pastry", "Food Brand / CPG", "Wine & Spirits", "Hotel & Accommodation", "Coffee Shop", "Personal Chef", "Meal Prep Service", "Food Blogger / Recipe Creator"],
  },
  {
    label: "Beauty & Personal Care", emoji: "💅",
    subs: ["Hair Salon", "Nail Studio", "Barbershop", "Tattoo & Piercing", "Esthetics & Waxing", "Permanent Makeup", "Lash & Brow Studio", "Skincare Clinic", "Makeup Artist", "Beauty School"],
  },
  {
    label: "Health & Wellness", emoji: "💪",
    subs: ["Fitness & Gym", "Personal Training", "Yoga & Meditation", "Mental Health", "Nutrition & Dietitian", "Medical Practice", "Alternative Medicine", "Spa & Massage", "Chiropractic", "Sound Bath & Breathwork", "Health Coaching"],
  },
  {
    label: "Spiritual & Holistic", emoji: "🔮",
    subs: ["Astrology & Tarot", "Energy Healing / Reiki", "Crystal & Spiritual Shop", "Manifestation Coaching", "Holistic Wellness", "Herbalism & Natural Remedies", "Spiritual Teacher / Guide"],
  },
  {
    label: "Education & Coaching", emoji: "🎓",
    subs: ["Online Courses", "Tutoring", "Language School", "University / School", "Kids Education", "Corporate Training", "Life Coaching", "Career Coaching", "Art & Craft Classes", "Music Lessons", "Dance Studio", "Cooking Classes"],
  },
  {
    label: "Kids & Family", emoji: "👶",
    subs: ["Children's Clothing Brand", "Toy Brand", "Family Activities & Entertainment", "Kids Classes & Camps", "Parenting Blog / Resource", "Maternity & Baby Products", "Family Photography", "Children's Books"],
  },
  {
    label: "Real Estate & Construction", emoji: "🏠",
    subs: ["Residential Real Estate", "Commercial Real Estate", "Property Management", "Home Renovation", "Interior Design", "Architecture", "Landscaping", "Cleaning Services", "Home Staging"],
  },
  {
    label: "Local Services & Trades", emoji: "🔧",
    subs: ["Electrician", "Plumber & HVAC", "Pest Control", "Moving Services", "Auto Repair & Detailing", "Dog Training & Grooming", "Locksmith", "Pool & Garden Services", "Security Systems"],
  },
  {
    label: "Business & Professional Services", emoji: "💼",
    subs: ["Consulting & Coaching", "Legal Services", "Finance & Accounting", "Insurance", "Recruiting & HR", "Marketing Agency", "PR & Communications", "Virtual Assistant", "Translation Services", "Freelance Writer / Editor"],
  },
  {
    label: "Tech & Digital", emoji: "💻",
    subs: ["SaaS / Software", "Mobile App", "Web Design & Dev", "Cybersecurity", "AI & Data", "IT Services", "Gaming", "Blockchain / Web3", "Tech Reviewer / Creator"],
  },
  {
    label: "Creative & Entertainment", emoji: "🎨",
    subs: ["Photography", "Videography", "Music & Artist", "Podcast", "Film & TV Production", "Graphic Design", "Animation", "Event Planning", "Wedding Services", "DJ & Entertainment"],
  },
  {
    label: "Creators & Personal Brand", emoji: "⭐",
    subs: ["Lifestyle Influencer", "Fashion Creator", "Beauty Creator", "Fitness Creator", "Food Creator", "Travel Creator", "DIY & Crafts Creator", "Gaming Creator", "Finance Creator", "Parenting Creator", "Personal Brand / Speaker", "Motivational Coach", "Artist / Illustrator"],
  },
  {
    label: "Non-Profit & Community", emoji: "🤝",
    subs: ["Non-Profit Organization", "Religious Organization", "Political Campaign", "Community Group", "Charity & Fundraising", "Animal Rescue & Shelter"],
  },
  {
    label: "Other Industries", emoji: "🌐",
    subs: ["Automotive", "Travel & Tourism", "Agriculture & Farming", "Manufacturing", "Sports Team / Athlete", "Childcare & Nursery", "Staffing Agency", "Import & Export", "Subscription Service"],
  },
];

const PLATFORMS = [
  { id: "Instagram", emoji: "📸" },
  { id: "LinkedIn", emoji: "💼" },
  { id: "Twitter / X", emoji: "🐦" },
  { id: "Facebook", emoji: "📘" },
  { id: "TikTok", emoji: "🎵" },
];

const GOALS = [
  { id: "Brand Awareness", desc: "Get more people to know about us" },
  { id: "Generate Leads", desc: "Attract potential customers" },
  { id: "Drive Sales", desc: "Convert followers into buyers" },
  { id: "Grow Community", desc: "Build an engaged audience" },
  { id: "Launch Something", desc: "Promote a new product or service" },
];

const BRAND_VOICES = [
  { label: "Professional", icon: Briefcase, desc: "Clean, authoritative, and polished" },
  { label: "Witty", icon: Mic, desc: "Clever humor with personality" },
  { label: "Energetic", icon: Sparkles, desc: "Bold, exciting, and action-driven" },
  { label: "Minimalist", icon: Globe, desc: "Simple, refined, and elegant" },
  { label: "Inspiring", icon: Target, desc: "Uplifting, motivational, emotional" },
  { label: "Casual & Friendly", icon: Users, desc: "Conversational, warm, approachable" },
];

const AGE_RANGES = [
  { id: "Gen Z (18–24)", desc: "Short-form video, trends, authenticity" },
  { id: "Millennials (25–35)", desc: "Story-driven, value-focused" },
  { id: "Gen X (36–50)", desc: "Informative, trust-building" },
  { id: "50+", desc: "Clear, helpful, community-focused" },
  { id: "All Ages", desc: "Broad appeal, versatile content" },
];

const CONTENT_TYPES = [
  { id: "Educational tips & how-tos", emoji: "📚" },
  { id: "Behind the scenes", emoji: "🎬" },
  { id: "Product / service showcase", emoji: "🛍️" },
  { id: "Customer stories & testimonials", emoji: "⭐" },
  { id: "Trending & relatable content", emoji: "🔥" },
  { id: "Promotions & offers", emoji: "🎁" },
  { id: "Motivational & inspirational", emoji: "💪" },
  { id: "Industry news & insights", emoji: "📰" },
];

const POSTING_FREQS = [
  { id: "Daily", desc: "7 posts/week — maximum reach" },
  { id: "3–4x per week", desc: "Consistent without burnout" },
  { id: "1–2x per week", desc: "Quality over quantity" },
  { id: "A few times a month", desc: "Highlight-focused approach" },
];

const Onboard = () => {
  const [step, setStep] = useState(0);
  // Step 0 — Company
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  // Step 1 — Industry
  const [industryCategory, setIndustryCategory] = useState("");
  const [industry, setIndustry] = useState<string[]>([]);

  const toggleIndustry = (sub: string) => {
    setIndustry((prev) =>
      prev.includes(sub) ? prev.filter((x) => x !== sub) : prev.length < 3 ? [...prev, sub] : prev
    );
  };
  // Step 2 — Platforms + Goal
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [campaignGoal, setCampaignGoal] = useState("");
  // Step 3 — Brand Voice
  const [brandVoice, setBrandVoice] = useState("");
  // Step 4 — Target Audience
  const [audienceType, setAudienceType] = useState<"B2B" | "B2C" | "">("");
  const [targetAgeRange, setTargetAgeRange] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  // Step 5 — Content Style
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [postingFrequency, setPostingFrequency] = useState("");
  // UI
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Setting up your agency...");
  const navigate = useNavigate();
  const { user } = useAuth();

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const toggleContentType = (ct: string) =>
    setContentTypes((prev) => prev.includes(ct) ? prev.filter((x) => x !== ct) : [...prev, ct]);

  const TOTAL_STEPS = 7;
  const canNext =
    (step === 0 && companyName.trim()) ||
    (step === 1 && industry.length > 0) ||
    (step === 2 && platforms.length > 0 && campaignGoal) ||
    (step === 3 && brandVoice) ||
    (step === 4 && audienceType && targetAgeRange) ||
    (step === 5 && contentTypes.length > 0 && postingFrequency) ||
    step === 6;

  const handleSubmit = async () => {
    if (!user) return;
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

      setIsDone(true);
      setLoadingMsg("Profile saved! Taking you to your dashboard...");
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err) {
      console.error("Onboard error:", err);
      setLoadingMsg("Something went wrong. Please try again.");
      setTimeout(() => { setIsLoading(false); setLoadingMsg("Setting up your agency..."); }, 2000);
    }
  };

  const stepLabels = ["Company", "Industry", "Platforms", "Voice", "Audience", "Content", "Review"];

  const steps = [
    // Step 0: Company info
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
    </motion.div>,

    // Step 1: Industry — two-level picker
    <motion.div key="industry" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
      {/* Category chips */}
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
      {/* Subcategory grid — appears after picking a category */}
      {industryCategory && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-2 pt-2">
          <div className="col-span-2 flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-body">
              Pick your niche in <span className="text-foreground font-semibold">{industryCategory}</span>:
            </p>
            <span className={`text-xs font-display font-semibold px-2 py-0.5 rounded-full ${
              industry.length === 3 ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            }`}>{industry.length}/3 selected</span>
          </div>
          {INDUSTRY_CATEGORIES.find((c) => c.label === industryCategory)?.subs.map((sub) => {
            const selected = industry.includes(sub);
            const maxed = industry.length >= 3 && !selected;
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
    </motion.div>,

    // Step 2: Platforms + Goal
    <motion.div key="platforms" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <div>
        <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-body">
          <Share2 className="w-4 h-4" /> Where do you want to post? (pick all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p.id} onClick={() => togglePlatform(p.id)}
              className={`px-4 py-2.5 rounded-lg border text-sm font-body transition-all flex items-center gap-2 ${
                platforms.includes(p.id) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30"
              }`}><span>{p.emoji}</span> {p.id}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-body">
          <Target className="w-4 h-4" /> What's the main goal of this campaign?
        </label>
        <div className="space-y-2">
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => setCampaignGoal(g.id)}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                campaignGoal === g.id ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-muted-foreground/30"
              }`}>
              <div className={`font-display font-semibold text-sm ${campaignGoal === g.id ? "text-foreground" : "text-muted-foreground"}`}>{g.id}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-body">{g.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>,

    // Step 3: Brand Voice
    <motion.div key="voice" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="grid grid-cols-2 gap-3">
      {BRAND_VOICES.map((voice) => (
        <button key={voice.label} onClick={() => setBrandVoice(voice.label)}
          className={`p-5 rounded-lg border text-left transition-all ${
            brandVoice === voice.label ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-muted-foreground/30"
          }`}>
          <voice.icon className={`w-5 h-5 mb-2 ${brandVoice === voice.label ? "text-primary" : "text-muted-foreground"}`} />
          <div className="font-display font-semibold text-sm">{voice.label}</div>
          <div className="text-xs text-muted-foreground mt-1">{voice.desc}</div>
        </button>
      ))}
    </motion.div>,

    // Step 4: Target Audience
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
    </motion.div>,

    // Step 5: Content Style
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
    </motion.div>,

    // Step 6: Review
    <motion.div key="review" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
      {[
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
      ].map((item) => (
        <div key={item.label} className="flex justify-between items-start py-3 border-b border-border/50 gap-4">
          <span className="text-muted-foreground text-sm font-body shrink-0">{item.label}</span>
          <span className="font-display font-medium text-sm text-right">{item.value}</span>
        </div>
      ))}
    </motion.div>,
  ];

  if (isLoading || isDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          {isLoading && !isDone ? (
            <>
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-6 animate-spin" />
              <h2 className="text-2xl font-display font-bold mb-2">Agent AAA is Launching</h2>
              <p className="text-muted-foreground font-body">{loadingMsg}</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-6" />
              <h2 className="text-2xl font-display font-bold mb-2">Swarm Launched!</h2>
              <p className="text-muted-foreground font-body">Taking you to your dashboard...</p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  const headings = ["Tell us about your business", "Select your industry", "Platforms & goals", "Choose your brand voice", "Who's your audience?", "Content style & frequency", "Review & Launch"];
  const subtitles = ["We'll use this to personalize your content.", "This helps us find relevant trends.", "The agents will tailor content for each platform.", "How should your content sound?", "The agents will write for your specific audience.", "This shapes how many posts we create and in what style.", "Everything look good?"];

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

        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>

        <div className="flex justify-between mt-10">
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0} className="font-display">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext} className="font-display">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="font-display glow-gold">
              <Sparkles className="w-4 h-4 mr-2" /> Launch Agent AAA
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboard;
