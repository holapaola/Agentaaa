export const INDUSTRY_CATEGORIES: { label: string; emoji: string; subs: string[] }[] = [
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

export const PLATFORM_OPTIONS = [
  { id: "Instagram", emoji: "📸" },
  { id: "LinkedIn", emoji: "💼" },
  { id: "Twitter / X", emoji: "🐦" },
  { id: "Facebook", emoji: "📘" },
  { id: "TikTok", emoji: "🎵" },
];

export const GOALS = [
  { id: "Brand Awareness", desc: "Get more people to know about us" },
  { id: "Generate Leads", desc: "Attract potential customers" },
  { id: "Drive Sales", desc: "Convert followers into buyers" },
  { id: "Grow Community", desc: "Build an engaged audience" },
  { id: "Launch Something", desc: "Promote a new product or service" },
];

export const BRAND_VOICES = [
  { label: "Professional", desc: "Clean, authoritative, and polished" },
  { label: "Witty", desc: "Clever humor with personality" },
  { label: "Energetic", desc: "Bold, exciting, and action-driven" },
  { label: "Minimalist", desc: "Simple, refined, and elegant" },
  { label: "Inspiring", desc: "Uplifting, motivational, emotional" },
  { label: "Casual & Friendly", desc: "Conversational, warm, approachable" },
];

export const AGE_RANGES = [
  { id: "Gen Z (18–24)", desc: "Short-form video, trends, authenticity" },
  { id: "Millennials (25–35)", desc: "Story-driven, value-focused" },
  { id: "Gen X (36–50)", desc: "Informative, trust-building" },
  { id: "50+", desc: "Clear, helpful, community-focused" },
  { id: "All Ages", desc: "Broad appeal, versatile content" },
];

export const CONTENT_TYPES = [
  { id: "Educational tips & how-tos", emoji: "📚" },
  { id: "Behind the scenes", emoji: "🎬" },
  { id: "Product / service showcase", emoji: "🛍️" },
  { id: "Customer stories & testimonials", emoji: "⭐" },
  { id: "Trending & relatable content", emoji: "🔥" },
  { id: "Promotions & offers", emoji: "🎁" },
  { id: "Motivational & inspirational", emoji: "💪" },
  { id: "Industry news & insights", emoji: "📰" },
];

export const POSTING_FREQS = [
  { id: "Daily", desc: "7 posts/week — maximum reach" },
  { id: "3–4x per week", desc: "Consistent without burnout" },
  { id: "1–2x per week", desc: "Quality over quantity" },
  { id: "A few times a month", desc: "Highlight-focused approach" },
];
