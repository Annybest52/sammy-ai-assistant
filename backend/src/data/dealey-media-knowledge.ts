// Dealey Media International - Knowledge Base Data
// This data is used to seed Sammy's knowledge about the business

export const DEALEY_MEDIA_KNOWLEDGE = {
  company: {
    name: "Dealey Media International",
    founder: "Ms. Niki Dealey",
    foundedYear: 2007,
    tagline: "Your Internet Marketing EXPERTS; Because RESULTS Matter!",
    phone: "844.364.4335 x 700",
    address: "539 W. Commerce St #7407 Dallas TX 75208",
    website: "https://dealeymediainternational.com",
    socialMedia: {
      facebook: "https://facebook.com/dealeymedia",
      instagram: "https://instagram.com/dealeymedia",
      twitter: "https://twitter.com/dealeymedia",
      linkedin: "https://linkedin.com/company/dealeymedia",
    },
    featuredOn: ["FOX", "CNN", "CBS", "NBC", "ABC"],
    teamSize: "33+ specialized team members",
    countriesServed: 5,
    values: ["AFFORDABLE", "RESULT DRIVEN", "LATEST TECHNOLOGIES (Artificial Intelligence)"],
  },

  services: [
    {
      name: "Graphic Design",
      description: "Professional graphic design services for branding, marketing materials, and digital assets.",
      category: "Marketing Solutions",
    },
    {
      name: "Website Development",
      description: "Custom website design and development to establish your online presence.",
      category: "Marketing Solutions",
    },
    {
      name: "Search Box Optimization (SBO)",
      description: "Be the FIRST Business Prospects See When They Search! Optimize your visibility in search box suggestions.",
      category: "Lead Generation",
    },
    {
      name: "A.I. Agent",
      description: "AI-powered virtual assistant that can handle customer interactions, answer questions, and automate business tasks 24/7.",
      category: "AI Solutions",
    },
    {
      name: "App Development",
      description: "Custom mobile and web application development for your business needs.",
      category: "Marketing Solutions",
    },
    {
      name: "Google Reviews",
      description: "Reputation management and Google Review optimization to build trust and credibility.",
      category: "Marketing Solutions",
    },
    {
      name: "IT Services",
      description: "Comprehensive IT support and technology solutions for businesses.",
      category: "Marketing Solutions",
    },
    {
      name: "Google Near Me",
      description: "Get Found Fast with Google 'Near Me' Optimization. Be Where Your Customers Are Searching. Local SEO optimization for location-based searches.",
      category: "Lead Generation",
    },
    {
      name: "Fractional Chief AI Officer",
      description: "Outsource your AI leadership role. Get real-life experience with results at a fraction of the cost of a full-time hire.",
      category: "AI Solutions",
    },
    {
      name: "Profit Partner Program (Agnes AI)",
      description: "Wake Up Your Dead Leads and Turn Them Into Profit. Become a Profit Partner with AI-powered lead reactivation.",
      category: "Lead Generation",
    },
    {
      name: "AI Assessment",
      description: "Comprehensive assessment of your business to identify AI implementation opportunities.",
      category: "AI Solutions",
    },
    {
      name: "AI Implementation",
      description: "Expert implementation of AI solutions tailored to your business objectives, budget, and timeframes.",
      category: "AI Solutions",
    },
    {
      name: "AI Training",
      description: "Training programs to help your team understand and leverage AI technologies effectively.",
      category: "AI Solutions",
    },
  ],

  pricing: {
    fractionalCAIO: [
      {
        tier: "SILVER",
        price: "$2,000 - $3,000/month",
        description: "The focus is on high-level strategy and advisory sessions.",
        bestFor: "Businesses starting their AI journey",
      },
      {
        tier: "GOLD",
        price: "$5,000 - $20,000/month",
        description: "More deeply involved in ongoing company projects, team training, and close collaboration with other executives.",
        bestFor: "Companies ready to scale AI initiatives",
      },
      {
        tier: "PLATINUM",
        price: "Personalized Quote",
        description: "Best for growing enterprises who have scaled past 2 sales professionals, spending money on ad buys, wanting to target specific niche clients.",
        bestFor: "Enterprise-level businesses",
      },
    ],
  },

  faqs: [
    {
      question: "What makes Dealey Media International different?",
      answer: "We are CERTIFIED ARTIFICIAL INTELLIGENCE CONSULTANTS with a highly qualified AI Implementation team. We don't put your objective in our box of solutions - we HEAR your objectives, budget, and time frames and STRATEGICALLY recommend solutions whether we offer them or not!",
    },
    {
      question: "How long has Dealey Media International been in business?",
      answer: "Since 2007 - we have extensive experience in internet marketing and now specialize in AI solutions.",
    },
    {
      question: "What countries does Dealey Media International serve?",
      answer: "We serve clients in 5 countries worldwide with our team of 33+ specialized members.",
    },
    {
      question: "Why should I outsource my CMO or Chief AI Officer role?",
      answer: "It is less expensive to outsource your Chief Marketing Officer or Chief AI Officer, despite the size of your business, than to hire full-time. You pay a fraction for a CMO/CAIO because they work a fraction of monthly time, but you get REAL LIFE experience with RESULTS!",
    },
    {
      question: "How can I contact Dealey Media International?",
      answer: "Call us at 844.364.4335 x 700 (for Ms. Niki Dealey, Founder) or visit our website at dealeymediainternational.com. Our mailing address is 539 W. Commerce St #7407 Dallas TX 75208.",
    },
    {
      question: "What is Search Box Optimization (SBO)?",
      answer: "Search Box Optimization ensures your business is the FIRST business prospects see when they search in Google's search box suggestions. It's a powerful lead generation strategy.",
    },
    {
      question: "What is the Profit Partner Program?",
      answer: "The Profit Partner Program, powered by Agnes AI, helps you wake up your dead leads and turn them into profit. It's an AI-powered lead reactivation system.",
    },
    {
      question: "What is an AI Agent?",
      answer: "An AI Agent is an artificial intelligence-powered virtual assistant that can handle customer interactions, answer questions about your services, book appointments, and automate business tasks 24/7.",
    },
  ],

  results: {
    salesFunnels: "500+",
    revenueGrowth: "200%+",
    qualityGuarantee: "100%",
    clientsWorldwide: "1K+",
  },
};

// Knowledge base documents for vector storage
export const KNOWLEDGE_DOCUMENTS = [
  {
    title: "About Dealey Media International",
    content: `Dealey Media International is an internet marketing company founded in 2007 by Ms. Niki Dealey. We are CERTIFIED ARTIFICIAL INTELLIGENCE CONSULTANTS with a highly qualified AI Implementation team. Our tagline is "Your Internet Marketing EXPERTS; Because RESULTS Matter!" We have been featured on FOX, CNN, CBS, NBC, and ABC. We have 33+ specialized team members serving clients in 5 countries worldwide. Contact us at 844.364.4335 x 700 or visit our office at 539 W. Commerce St #7407 Dallas TX 75208.`,
    category: "company",
  },
  {
    title: "Services Offered by Dealey Media International",
    content: `We offer a comprehensive range of services including: Graphic Design, Website Development, Search Box Optimization (SBO), A.I. Agent, App Development, Google Reviews management, IT Services, Google Near Me optimization, Fractional Chief AI Officer, Profit Partner Program (Agnes AI), AI Assessment, AI Implementation, and AI Training. Our services are AFFORDABLE, RESULT DRIVEN, and use the LATEST TECHNOLOGIES including Artificial Intelligence.`,
    category: "services",
  },
  {
    title: "Fractional Chief AI Officer Pricing",
    content: `We offer Fractional Chief AI Officer packages: SILVER ($2,000-$3,000/month) focuses on high-level strategy and advisory sessions. GOLD ($5,000-$20,000/month) involves deeper engagement with ongoing company projects, team training, and close collaboration with other executives. PLATINUM (Personalized Quote) is best for growing enterprises who have scaled past 2 sales professionals, spending money on ad buys, wanting to target specific niche clients.`,
    category: "pricing",
  },
  {
    title: "AI Solutions at Dealey Media International",
    content: `We help businesses "AI-ify" to increase revenues. Our AI solutions include: AI Assessment to identify opportunities, AI Implementation tailored to your objectives and budget, AI Training for your team, Fractional Chief AI Officer services, and A.I. Agent technology. We don't put your objective in our box of solutions - we HEAR your objectives, budget, and time frames and STRATEGICALLY recommend solutions.`,
    category: "services",
  },
  {
    title: "Lead Generation Services",
    content: `Our lead generation services include: Profit Partner Program powered by Agnes AI to wake up dead leads and turn them into profit, Search Box Optimization (SBO) to be the first business prospects see when they search, Google Near Me optimization for local searches, and A.I. Agent for 24/7 customer engagement and lead capture.`,
    category: "services",
  },
  {
    title: "Contact Dealey Media International",
    content: `Phone: 844.364.4335 x 700 (for Ms. Niki Dealey, Founder). Mailing Address: 539 W. Commerce St #7407 Dallas TX 75208. Website: dealeymediainternational.com. Follow us on Facebook, Instagram, Twitter, and LinkedIn.`,
    category: "contact",
  },
  {
    title: "Results and Track Record",
    content: `Dealey Media International has achieved impressive results: 500+ Sales Funnels created, 200%+ Revenue Growth for clients, 100% Quality Guarantee, and 1K+ Clients Worldwide. This is NOT our first rodeo - our team is very proud of our results since 2007!`,
    category: "results",
  },
];

