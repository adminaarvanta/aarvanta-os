import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { crmNow } from "@/lib/data/crm-helpers";
import {
  buildContentBrief,
  nicheImages,
  type ContentBrief,
} from "@/lib/site-builder/content-brief";
import { preferSampleFilledSite } from "@/lib/site-builder/ensure-sample-data";
import { getThemePreset } from "@/lib/site-builder/theme-presets";
import type {
  GeneratedSite,
  GeneratedSitePage,
  SiteBlock,
  SitePlan,
  SitePreferences,
} from "@/types/site-builder";

let blockSeq = 0;
function blockId(type: string, label: string): string {
  blockSeq += 1;
  return `${type}_${label.replace(/\s+/g, "_").toLowerCase()}_${blockSeq}`;
}

function featuresFor(brief: ContentBrief): SiteBlock {
  const packs: Record<
    ContentBrief["niche"],
    Array<{ title: string; description: string; icon: string }>
  > = {
    candles: [
      {
        title: "Clean-burning soy",
        description: "Plant-based wax with cotton wicks — soft light, low soot.",
        icon: "flame",
      },
      {
        title: "Gift-ready packaging",
        description: "Every order arrives wrapped for birthdays, hosts, and thank-yous.",
        icon: "gift",
      },
      {
        title: "Subscribe & save",
        description: "Monthly scent drops so your favourite rooms never go dark.",
        icon: "refresh",
      },
    ],
    dental: [
      {
        title: "Same-week appointments",
        description: "Flexible booking for busy families — evenings available.",
        icon: "calendar",
      },
      {
        title: "Transparent pricing",
        description: "Clear treatment plans before we start. No surprise invoices.",
        icon: "shield",
      },
      {
        title: "Gentle chairside care",
        description: "Modern equipment and a calm team who explain every step.",
        icon: "heart",
      },
    ],
    saas: [
      {
        title: "Setup in minutes",
        description: "Connect your bank and invoices — no accounting degree required.",
        icon: "zap",
      },
      {
        title: "Clear cash view",
        description: "Know what you earned, what you owe, and what’s left this month.",
        icon: "chart",
      },
      {
        title: "Tax-ready exports",
        description: "Clean reports your accountant will actually thank you for.",
        icon: "file",
      },
    ],
    architecture: [
      {
        title: "Site-first thinking",
        description: "Every project starts with light, context, and how people move.",
        icon: "compass",
      },
      {
        title: "Detail obsession",
        description: "Joinery, materials, and thresholds treated as the design — not afterthoughts.",
        icon: "layers",
      },
      {
        title: "Collaborative process",
        description: "Clear milestones from concept sketches through build support.",
        icon: "users",
      },
    ],
    restaurant: [
      {
        title: "Seasonal menus",
        description: "Ingredients that change with the market — plates that stay interesting.",
        icon: "leaf",
      },
      {
        title: "Warm hospitality",
        description: "Service that feels personal without being performative.",
        icon: "heart",
      },
      {
        title: "Easy reservations",
        description: "Book online for two or twenty — we’ll set the table.",
        icon: "calendar",
      },
    ],
    fitness: [
      {
        title: "Coaching that sticks",
        description: "Programs built around your week, not a fantasy schedule.",
        icon: "target",
      },
      {
        title: "Community energy",
        description: "Classes where people show up for each other — and themselves.",
        icon: "users",
      },
      {
        title: "Results you feel",
        description: "Strength, mobility, and confidence tracked without the fluff.",
        icon: "zap",
      },
    ],
    fashion: [
      {
        title: "Edited drops",
        description: "Fewer pieces, better fabrics — nothing filler in the rack.",
        icon: "sparkles",
      },
      {
        title: "Everyday luxury",
        description: "Cuts and materials meant for real life, not just lookbooks.",
        icon: "shirt",
      },
      {
        title: "Easy returns",
        description: "Try at home with free exchanges within 30 days.",
        icon: "refresh",
      },
    ],
    agency: [
      {
        title: "Strategy before pixels",
        description: "Positioning and messaging locked before we design a thing.",
        icon: "compass",
      },
      {
        title: "Launch-ready systems",
        description: "Brand kits, campaigns, and sites that your team can actually run.",
        icon: "layers",
      },
      {
        title: "Partners, not vendors",
        description: "One team accountable from brief through performance reviews.",
        icon: "users",
      },
    ],
    coaching: [
      {
        title: "Weekly accountability",
        description: "Clear goals, honest check-ins, and momentum you can measure.",
        icon: "target",
      },
      {
        title: "Practical frameworks",
        description: "Tools you reuse long after the session ends.",
        icon: "file",
      },
      {
        title: "Human first",
        description: "Supportive challenge — never empty motivational noise.",
        icon: "heart",
      },
    ],
    general: [
      {
        title: "Built around you",
        description: `Designed for ${brief.audience} who expect clarity and care.`,
        icon: "sparkles",
      },
      {
        title: `Trusted in ${brief.country}`,
        description: "Local presence with standards that feel premium.",
        icon: "shield",
      },
      {
        title: "Clear next step",
        description: `Everything on this site points toward one action: ${brief.cta.toLowerCase()}.`,
        icon: "zap",
      },
    ],
  };

  return {
    id: blockId("features", "value"),
    type: "features",
    props: {
      title: "Why people choose us",
      subtitle: `What ${brief.brand} gets right for ${brief.audience}.`,
      items: packs[brief.niche],
    },
  };
}

function productsFor(brief: ContentBrief): SiteBlock {
  const images = nicheImages(brief.niche);
  const c = brief.currency;
  const catalogs: Record<
    ContentBrief["niche"],
    Array<{ name: string; description: string; price: string; badge?: string }>
  > = {
    candles: [
      {
        name: "Amber Grove",
        description: "Cedar, orange peel, and soft vanilla — evening in a jar.",
        price: `${c}28`,
        badge: "Bestseller",
      },
      {
        name: "Coastal Linen",
        description: "Sea salt, cotton flower, and a clean morning finish.",
        price: `${c}26`,
      },
      {
        name: "Fireside Ritual",
        description: "Smoked wood and clove — made for slower nights.",
        price: `${c}32`,
        badge: "Limited",
      },
    ],
    dental: [
      {
        name: "New patient exam",
        description: "Full check-up, clean, and digital scan with a clear plan.",
        price: `${c}89`,
        badge: "Popular",
      },
      {
        name: "Whitening package",
        description: "In-clinic whitening with take-home trays for lasting brightness.",
        price: `${c}349`,
      },
      {
        name: "Family plan",
        description: "Annual care for up to four — exams, cleans, and priority booking.",
        price: `${c}29/mo`,
      },
    ],
    saas: [
      {
        name: "Starter",
        description: "Invoices, expense capture, and a live cash snapshot.",
        price: `${c}19/mo`,
      },
      {
        name: "Growth",
        description: "Multi-client, tax packs, and priority chat support.",
        price: `${c}49/mo`,
        badge: "Most chosen",
      },
      {
        name: "Studio",
        description: "Team seats, approvals, and accountant-ready exports.",
        price: `${c}99/mo`,
      },
    ],
    architecture: [
      {
        name: "Concept study",
        description: "Site analysis, massing options, and a clear design direction.",
        price: `from ${c}4.5k`,
      },
      {
        name: "Full residence",
        description: "Architecture through construction documentation.",
        price: `from ${c}28k`,
        badge: "Signature",
      },
      {
        name: "Interiors package",
        description: "Material palette, joinery, and lighting for one floor.",
        price: `from ${c}12k`,
      },
    ],
    restaurant: [
      {
        name: "Chef’s tasting",
        description: "Five courses that follow the season — wine pairing optional.",
        price: `${c}65`,
        badge: "Tonight",
      },
      {
        name: "Weekend brunch",
        description: "Slow plates, fresh pastry, and bottomless filter coffee.",
        price: `${c}28`,
      },
      {
        name: "Private dining",
        description: "The back room for birthdays, clients, and celebrations.",
        price: `from ${c}450`,
      },
    ],
    fitness: [
      {
        name: "Drop-in class",
        description: "Strength or mobility — coaches who know your name.",
        price: `${c}18`,
      },
      {
        name: "Unlimited month",
        description: "All classes, open gym hours, and a starter assessment.",
        price: `${c}89/mo`,
        badge: "Best value",
      },
      {
        name: "1:1 coaching",
        description: "Personal program with weekly form checks.",
        price: `${c}160/mo`,
      },
    ],
    fashion: [
      {
        name: "Everyday blazer",
        description: "Soft structure that works from desk to dinner.",
        price: `${c}148`,
        badge: "New",
      },
      {
        name: "Linen set",
        description: "Breathable two-piece in washed earth tones.",
        price: `${c}120`,
      },
      {
        name: "Weekend tote",
        description: "Full-grain leather that ages with you.",
        price: `${c}95`,
      },
    ],
    agency: [
      {
        name: "Brand sprint",
        description: "Positioning, identity system, and launch guidelines in three weeks.",
        price: `from ${c}8k`,
      },
      {
        name: "Campaign retainers",
        description: "Ongoing creative for channels that need to keep shipping.",
        price: `from ${c}4k/mo`,
        badge: "Retainer",
      },
      {
        name: "Site rebuild",
        description: "Conversion-focused web experience with CMS training.",
        price: `from ${c}15k`,
      },
    ],
    coaching: [
      {
        name: "Discovery call",
        description: "45 minutes to map goals and see if we’re a fit.",
        price: "Free",
        badge: "Start here",
      },
      {
        name: "12-week program",
        description: "Weekly sessions, async support, and a written action system.",
        price: `${c}1,800`,
      },
      {
        name: "Leadership circle",
        description: "Small-group coaching for founders and managers.",
        price: `${c}220/mo`,
      },
    ],
    general: [
      {
        name: "Signature offer",
        description: brief.idea.slice(0, 90) || "Our flagship product for first-time customers.",
        price: `${c}49`,
        badge: "Featured",
      },
      {
        name: "Essentials bundle",
        description: "The complete starter set most customers choose.",
        price: `${c}89`,
      },
      {
        name: "Membership",
        description: "Ongoing access with member-only drops and support.",
        price: `${c}19/mo`,
      },
    ],
  };

  return {
    id: blockId("products", "catalog"),
    type: "products",
    props: {
      title: brief.siteType === "landing" ? "Plans that scale with you" : "Featured offerings",
      subtitle: "Clear options — pick what fits today.",
      products: catalogs[brief.niche].map((p, i) => ({
        ...p,
        imageUrl: images.products[i % images.products.length],
      })),
    },
  };
}

function pricingFor(brief: ContentBrief): SiteBlock {
  const c = brief.currency;
  const saas = brief.niche === "saas" || brief.siteType === "landing";
  return {
    id: blockId("pricing", "tiers"),
    type: "pricing",
    props: {
      title: "Simple pricing",
      subtitle: "Start small. Upgrade when you’re ready.",
      tiers: saas
        ? [
            {
              name: "Starter",
              price: `${c}19/mo`,
              features: ["Core dashboard", "Email support", "1 workspace"],
            },
            {
              name: "Growth",
              price: `${c}49/mo`,
              features: ["Everything in Starter", "Automations", "Priority chat"],
              highlighted: true,
            },
            {
              name: "Studio",
              price: `${c}99/mo`,
              features: ["Team seats", "SSO-ready", "Dedicated onboarding"],
            },
          ]
        : [
            {
              name: "Essential",
              price: `${c}99`,
              features: ["Core package", "Email support", "14-day tweaks"],
            },
            {
              name: "Signature",
              price: `${c}249`,
              features: ["Premium package", "Priority support", "Strategy call"],
              highlighted: true,
            },
            {
              name: "Custom",
              price: "Let’s talk",
              features: ["Bespoke scope", "Account lead", "SLA options"],
            },
          ],
    },
  };
}

function testimonialsFor(brief: ContentBrief): SiteBlock {
  const quotes: Record<
    ContentBrief["niche"],
    Array<{ text: string; author: string; role: string }>
  > = {
    candles: [
      {
        text: "Our living room finally smells like a weekend away. Packaging was beautiful.",
        author: "Priya S.",
        role: "Subscriber, London",
      },
      {
        text: "Bought three as gifts — every recipient asked where they came from.",
        author: "Tom H.",
        role: "Gift shopper",
      },
    ],
    dental: [
      {
        text: "First dentist visit my kids didn’t dread. Clear plan, no rush.",
        author: "Amelia R.",
        role: "Parent of two",
      },
      {
        text: "Whitening results were honest and the pricing was exactly as quoted.",
        author: "Daniel K.",
        role: "New patient",
      },
    ],
    saas: [
      {
        text: "I stopped living in spreadsheets within a week. Tax pack alone paid for itself.",
        author: "Jess M.",
        role: "Freelance designer",
      },
      {
        text: "My accountant actually smiled. Exports are clean and labelled.",
        author: "Omar F.",
        role: "Agency founder",
      },
    ],
    architecture: [
      {
        text: "They treated light as a material. The finished house feels inevitable.",
        author: "Claire & Ben",
        role: "Homeowners",
      },
      {
        text: "Documentation was so clear our contractor had almost zero RFIs.",
        author: "Nadia V.",
        role: "Developer",
      },
    ],
    restaurant: [
      {
        text: "Booked for an anniversary — paced perfectly, not a single cold plate.",
        author: "Hannah L.",
        role: "Regular",
      },
      {
        text: "Brunch that actually tastes seasonal. We’ll be back next Sunday.",
        author: "Marcus W.",
        role: "Local guide",
      },
    ],
    fitness: [
      {
        text: "Coaches remember my injuries and still push me. Rare combination.",
        author: "Sofia P.",
        role: "Member · 8 months",
      },
      {
        text: "Class energy without the bro culture. Strength finally feels sustainable.",
        author: "Ryan C.",
        role: "Unlimited plan",
      },
    ],
    fashion: [
      {
        text: "The blazer somehow works with jeans and a dress. That’s the whole point.",
        author: "Elena G.",
        role: "Repeat customer",
      },
      {
        text: "Quality you feel in the stitching. Returns were painless when I sized wrong.",
        author: "Jordan A.",
        role: "Verified buyer",
      },
    ],
    agency: [
      {
        text: "They killed our vague tagline in week one — and the new one still converts.",
        author: "Leah N.",
        role: "CMO",
      },
      {
        text: "Launch assets arrived early, on-brand, and ready for the sales team.",
        author: "Chris D.",
        role: "Founder",
      },
    ],
    coaching: [
      {
        text: "I finally have a weekly system that survives busy seasons.",
        author: "Anita B.",
        role: "Founder",
      },
      {
        text: "Direct feedback without the fluff. Exactly what I needed.",
        author: "Mark T.",
        role: "Engineering lead",
      },
    ],
    general: [
      {
        text: `${brief.brand} made the whole process feel simple and premium.`,
        author: "Alex M.",
        role: "Customer",
      },
      {
        text: "Clear communication and results that matched the promise.",
        author: "Sam R.",
        role: "Customer",
      },
    ],
  };

  return {
    id: blockId("testimonials", "proof"),
    type: "testimonials",
    props: {
      title: "Loved by people like you",
      subtitle: `Real words from ${brief.audience}.`,
      quotes: quotes[brief.niche],
    },
  };
}

function galleryFor(brief: ContentBrief): SiteBlock {
  const images = nicheImages(brief.niche);
  const titles: Record<ContentBrief["niche"], string[]> = {
    candles: ["Pouring room", "Gift sets", "Scent library"],
    dental: ["Treatment suites", "Reception", "Kids corner"],
    saas: ["Dashboard", "Mobile reports", "Team workspace"],
    architecture: ["Courtyard house", "City loft", "Studio annex"],
    restaurant: ["Dining room", "Open kitchen", "Private table"],
    fitness: ["Training floor", "Mobility studio", "Locker lounge"],
    fashion: ["Lookbook", "Atelier", "Street edit"],
    agency: ["War room", "Brand systems", "Launch day"],
    coaching: ["Session space", "Workshop", "Community"],
    general: ["Studio", "Details", "People"],
  };

  return {
    id: blockId("gallery", "work"),
    type: "gallery",
    props: {
      title: brief.siteType === "portfolio" ? "Selected work" : "Inside the brand",
      subtitle: "A closer look at the craft.",
      items: titles[brief.niche].map((title, i) => ({
        title,
        caption: `${brief.brand} · ${title}`,
        imageUrl: images.gallery[i % images.gallery.length],
      })),
    },
  };
}

function faqFor(brief: ContentBrief): SiteBlock {
  return {
    id: blockId("faq", "common"),
    type: "faq",
    props: {
      title: "Questions, answered",
      items: [
        {
          q: "How do I get started?",
          a: `Hit “${brief.cta}” and we’ll guide you through the next step in under two minutes.`,
        },
        {
          q: `Do you serve customers outside ${brief.country}?`,
          a: `Yes — ${brief.brand} primarily serves ${brief.country}, with options for remote and international clients where it makes sense.`,
        },
        {
          q: "What makes you different?",
          a:
            brief.idea.slice(0, 160) ||
            `We obsess over clarity for ${brief.audience} — fewer options, better outcomes.`,
        },
        {
          q: "Can I change my mind later?",
          a: "Absolutely. Plans and orders are flexible — talk to us and we’ll adjust.",
        },
      ],
    },
  };
}

function statsFor(brief: ContentBrief): SiteBlock {
  const packs: Record<ContentBrief["niche"], Array<{ value: string; label: string }>> = {
    candles: [
      { value: "12k+", label: "Candles poured" },
      { value: "4.9★", label: "Average review" },
      { value: "48h", label: "Dispatch window" },
    ],
    dental: [
      { value: "2.4k", label: "Patients cared for" },
      { value: "96%", label: "Would recommend" },
      { value: "Same week", label: "Typical booking" },
    ],
    saas: [
      { value: "8k+", label: "Freelancers onboarded" },
      { value: "4.8★", label: "App store rating" },
      { value: "12 min", label: "Average setup" },
    ],
    architecture: [
      { value: "40+", label: "Built projects" },
      { value: "12 yrs", label: "Practice" },
      { value: "3", label: "Design awards" },
    ],
    restaurant: [
      { value: "120", label: "Covers nightly" },
      { value: "18", label: "Seasonal dishes" },
      { value: "4.7★", label: "Guest rating" },
    ],
    fitness: [
      { value: "500+", label: "Active members" },
      { value: "40", label: "Classes / week" },
      { value: "92%", label: "Goal completion" },
    ],
    fashion: [
      { value: "30+", label: "New styles / season" },
      { value: "Free", label: "UK returns" },
      { value: "4.8★", label: "Fit reviews" },
    ],
    agency: [
      { value: "85+", label: "Brands launched" },
      { value: "3.2×", label: "Avg. lift" },
      { value: "14", label: "Specialists" },
    ],
    coaching: [
      { value: "300+", label: "Clients coached" },
      { value: "12 wks", label: "Core program" },
      { value: "94%", label: "Would refer" },
    ],
    general: [
      { value: "5★", label: "Service focus" },
      { value: "24h", label: "Response time" },
      { value: "100%", label: "Human support" },
    ],
  };

  return {
    id: blockId("stats", "proof"),
    type: "stats",
    props: { items: packs[brief.niche] },
  };
}

function storyFor(brief: ContentBrief): SiteBlock {
  return {
    id: blockId("story", "about"),
    type: "split",
    props: {
      eyebrow: "Our story",
      title: `Why ${brief.brand} exists`,
      body:
        brief.idea ||
        `${brief.brand} started with a simple belief: ${brief.audience} deserve an experience that feels considered — not assembled from templates.`,
      bullets: [
        `Rooted in ${brief.country}`,
        `Built for ${brief.audience}`,
        "Obsessed with the details customers actually notice",
      ],
      imageUrl: nicheImages(brief.niche).gallery[0],
      cta: brief.secondaryCta,
    },
  };
}

function teamFor(brief: ContentBrief): SiteBlock {
  const images = nicheImages(brief.niche);
  const rosters: Record<
    ContentBrief["niche"],
    Array<{ name: string; role: string; bio: string }>
  > = {
    candles: [
      { name: "Maya Ellison", role: "Founder & scent lead", bio: "Former florist who obsesses over slow burns." },
      { name: "Noah Patel", role: "Studio pourer", bio: "Keeps every batch colour-matched and gift-ready." },
      { name: "Ivy Chen", role: "Customer care", bio: "Writes the handwritten notes in every box." },
    ],
    dental: [
      { name: "Dr. Helen Park", role: "Principal dentist", bio: "Calm chairside manner, 12 years in practice." },
      { name: "James Okonkwo", role: "Hygienist", bio: "Makes cleanings feel quick and painless." },
      { name: "Sofia Alvarez", role: "Treatment coordinator", bio: "Explains plans in plain English before you commit." },
    ],
    saas: [
      { name: "Aria Quinn", role: "CEO", bio: "Ex-accountant building tools freelancers actually finish setup for." },
      { name: "Ben Torres", role: "Head of product", bio: "Turns tax headaches into three-click flows." },
      { name: "Lina Berg", role: "Customer success", bio: "Onboards new workspaces in under a lunch break." },
    ],
    architecture: [
      { name: "Maya Chen", role: "Principal architect", bio: "Light-first residential work across the UK." },
      { name: "Owen Blake", role: "Project architect", bio: "Detail drawings contractors actually enjoy reading." },
      { name: "Rae Singh", role: "Interiors lead", bio: "Material palettes that age instead of trend-chase." },
    ],
    restaurant: [
      { name: "Chef Luca Moretti", role: "Executive chef", bio: "Seasonal menus written around the morning market." },
      { name: "Priya Nair", role: "Front of house", bio: "Remembers regulars and anniversaries." },
      { name: "Sam Reed", role: "Sommelier", bio: "Pairings that stay understated and generous." },
    ],
    fitness: [
      { name: "Jordan Miles", role: "Head coach", bio: "Strength programming without the ego." },
      { name: "Aisha Rahman", role: "Mobility coach", bio: "Fixes the desks that wreck people’s backs." },
      { name: "Chris Nolan", role: "Community lead", bio: "Keeps classes welcoming for first-timers." },
    ],
    fashion: [
      { name: "Elena Vogt", role: "Creative director", bio: "Edits every drop down to the essentials." },
      { name: "Marcus Lee", role: "Fit specialist", bio: "Obsessed with sleeves that actually move." },
      { name: "Noor Haddad", role: "Studio manager", bio: "Runs production with quiet precision." },
    ],
    agency: [
      { name: "Leah North", role: "Strategy director", bio: "Kills vague taglines before design starts." },
      { name: "Diego Ramos", role: "Creative director", bio: "Builds systems brands can run without us." },
      { name: "Hannah Cho", role: "Producer", bio: "Launches on time — and on brand." },
    ],
    coaching: [
      { name: "Anita Brooks", role: "Lead coach", bio: "Weekly systems for founders in busy seasons." },
      { name: "Mark Trent", role: "Leadership coach", bio: "Direct feedback without motivational fluff." },
      { name: "Zoe Hart", role: "Program manager", bio: "Keeps accountability kind and measurable." },
    ],
    general: [
      { name: "Alex Morgan", role: "Founder", bio: `Built ${brief.brand} around clarity for ${brief.audience}.` },
      { name: "Sam Rivera", role: "Operations", bio: "Keeps delivery sharp and communication human." },
      { name: "Jordan Lee", role: "Customer lead", bio: "First reply within a business day — always." },
    ],
  };

  return {
    id: blockId("team", "people"),
    type: "team",
    props: {
      title: "Meet the people",
      subtitle: `The humans behind ${brief.brand}.`,
      members: rosters[brief.niche].map((member, i) => ({
        ...member,
        imageUrl: images.gallery[i % images.gallery.length],
      })),
    },
  };
}

function contactFor(brief: ContentBrief, preferences: SitePreferences): SiteBlock {
  return {
    id: blockId("contact", "form"),
    type: "contact",
    props: {
      title: "Let’s talk",
      description: `Tell us what you need — ${brief.brand} typically replies within one business day.`,
      showForm: preferences.features.includes("contact_form") || true,
      email: `hello@${brief.brand.toLowerCase().replace(/[^a-z0-9]+/g, "") || "hello"}.com`,
      phone: /uk|united kingdom|britain/i.test(brief.country)
        ? "+44 20 7946 0958"
        : "+1 (415) 555-0134",
      address: `${brief.country} · Studio & remote`,
      hours: "Mon–Fri 9:00–18:00 · Sat by appointment",
      cta: brief.cta,
    },
  };
}

function ctaFor(brief: ContentBrief): SiteBlock {
  return {
    id: blockId("cta", "convert"),
    type: "cta",
    props: {
      title: `Ready when you are`,
      description: `Join ${brief.audience} who already trust ${brief.brand}.`,
      cta: brief.cta,
      secondaryCta: brief.secondaryCta,
    },
  };
}

function blogFor(brief: ContentBrief): SiteBlock {
  return {
    id: blockId("blog", "latest"),
    type: "blog",
    props: {
      title: "From the journal",
      posts: [
        {
          title: `How ${brief.brand} thinks about quality`,
          excerpt: "A short note on the standards behind every launch.",
          date: "This week",
          imageUrl: nicheImages(brief.niche).gallery[1],
        },
        {
          title: `A guide for ${brief.audience}`,
          excerpt: "Practical tips drawn from real customer conversations.",
          date: "This month",
          imageUrl: nicheImages(brief.niche).gallery[2],
        },
      ],
    },
  };
}

function heroFor(brief: ContentBrief, pageTitle: string): SiteBlock {
  const isHome = pageTitle === "Home";
  return {
    id: blockId("hero", pageTitle),
    type: "hero",
    props: {
      eyebrow: isHome ? brief.tagline : pageTitle,
      headline: isHome ? brief.headline : `${pageTitle} — ${brief.brand}`,
      subheadline: isHome
        ? brief.subheadline
        : `Explore how ${brief.brand} helps ${brief.audience}.`,
      cta: brief.cta,
      secondaryCta: brief.secondaryCta,
      imageUrl: nicheImages(brief.niche).hero,
      layout: brief.siteType === "portfolio" ? "split" : "fullBleed",
    },
  };
}

function homeBlocks(brief: ContentBrief, preferences: SitePreferences): SiteBlock[] {
  const base = [heroFor(brief, "Home"), statsFor(brief), featuresFor(brief)];

  switch (brief.siteType) {
    case "store":
      return [
        ...base,
        productsFor(brief),
        galleryFor(brief),
        testimonialsFor(brief),
        faqFor(brief),
        ctaFor(brief),
      ];
    case "landing":
      return [
        heroFor(brief, "Home"),
        statsFor(brief),
        featuresFor(brief),
        productsFor(brief),
        pricingFor(brief),
        testimonialsFor(brief),
        faqFor(brief),
        ctaFor(brief),
      ];
    case "portfolio":
      return [
        heroFor(brief, "Home"),
        galleryFor(brief),
        storyFor(brief),
        testimonialsFor(brief),
        ctaFor(brief),
      ];
    default:
      return [
        ...base,
        storyFor(brief),
        productsFor(brief),
        testimonialsFor(brief),
        faqFor(brief),
        ctaFor(brief),
      ];
  }
}

function pageBlocks(
  pageKey: string,
  brief: ContentBrief,
  preferences: SitePreferences
): SiteBlock[] {
  switch (pageKey) {
    case "home":
    case "":
      return homeBlocks(brief, preferences);
    case "about":
      return [
        heroFor(brief, "About"),
        storyFor(brief),
        teamFor(brief),
        statsFor(brief),
        testimonialsFor(brief),
        ctaFor(brief),
      ];
    case "services":
      return [heroFor(brief, "Services"), featuresFor(brief), productsFor(brief), ctaFor(brief)];
    case "products":
      return [heroFor(brief, "Products"), productsFor(brief), faqFor(brief), ctaFor(brief)];
    case "pricing":
      return [heroFor(brief, "Pricing"), pricingFor(brief), faqFor(brief), ctaFor(brief)];
    case "portfolio":
      return [heroFor(brief, "Portfolio"), galleryFor(brief), testimonialsFor(brief), ctaFor(brief)];
    case "testimonials":
      return [heroFor(brief, "Stories"), testimonialsFor(brief), statsFor(brief), ctaFor(brief)];
    case "faq":
      return [heroFor(brief, "FAQ"), faqFor(brief), contactFor(brief, preferences)];
    case "blog":
      return [heroFor(brief, "Journal"), blogFor(brief), ctaFor(brief)];
    case "contact":
      return [heroFor(brief, "Contact"), contactFor(brief, preferences)];
    default:
      return [heroFor(brief, pageKey), featuresFor(brief), ctaFor(brief)];
  }
}

function buildTheme(plan: SitePlan, preferences: SitePreferences): GeneratedSite["theme"] {
  const preset = getThemePreset(preferences.themePreset);
  return {
    presetId: preset.id,
    primaryColor: plan.theme?.primaryColor ?? preset.primaryColor,
    accentColor: plan.theme?.accentColor ?? preset.accentColor,
    backgroundColor: plan.theme?.backgroundColor ?? preset.backgroundColor,
    fontStyle: plan.theme?.fontStyle ?? preset.fontStyle,
    styleNotes: plan.theme?.styleNotes ?? preset.description,
    fontFamily: preset.fontFamily,
    headingFont: preset.headingFont,
    googleFontsUrl: preset.googleFontsUrl,
  };
}

function heuristicGenerate(plan: SitePlan, preferences: SitePreferences): GeneratedSite {
  blockSeq = 0;
  const brief = buildContentBrief(preferences);
  const pages: GeneratedSitePage[] = plan.pages.map((page) => {
    const key = page.slug === "" ? "home" : page.slug;
    return {
      slug: page.slug,
      title: page.title,
      blocks: pageBlocks(key, brief, preferences),
    };
  });

  // Guarantee a rich home page even if the plan omitted it.
  if (!pages.some((p) => p.slug === "" || p.title === "Home")) {
    pages.unshift({
      slug: "",
      title: "Home",
      blocks: homeBlocks(brief, preferences),
    });
  }

  return {
    siteName: plan.siteName || brief.brand,
    slug: plan.slug,
    tagline: brief.tagline,
    footerNote: `© ${new Date().getFullYear()} ${brief.brand}. Crafted with Aarvanta Build OS.`,
    theme: buildTheme(plan, preferences),
    navigation: plan.navigation.length
      ? plan.navigation
      : pages.map((p) => ({ label: p.title, slug: p.slug })),
    pages,
    generatedAt: crmNow(),
  };
}

export async function generateSiteFromPlan(
  plan: SitePlan,
  preferences: SitePreferences
): Promise<{ site: GeneratedSite; usedAi: boolean }> {
  // Sample-filled heuristic site is the source of truth so previews never look empty.
  const sampleSite = heuristicGenerate(plan, preferences);

  if (!isAiConfigured()) {
    return { site: sampleSite, usedAi: false };
  }

  try {
    const brief = buildContentBrief(preferences);
    const aiSite = await completeJson<GeneratedSite>({
      system: `You are Build OS, an expert website copywriter.
Return JSON for a complete multi-page marketing website. Every list must be filled:
- products: at least 3 items with name, description, price, imageUrl
- features/stats/faq items: at least 3
- testimonials quotes: at least 2 with author + role
- gallery items: at least 3 with imageUrl
- team members: at least 3 when present
Never return empty arrays. Use https://images.unsplash.com/ photo URLs.
Home slug is "". Match the user's tone, site type, and CTA.`,
      user: JSON.stringify({
        preferences,
        brief,
        planSummary: plan.summary,
        navigation: plan.navigation,
        pages: plan.pages.map((p) => ({ slug: p.slug, title: p.title, purpose: p.purpose })),
        theme: plan.theme,
        sampleHomeBlockTypes: sampleSite.pages[0]?.blocks.map((b) => b.type),
      }),
      temperature: 0.55,
    });
    return {
      site: preferSampleFilledSite(sampleSite, aiSite),
      usedAi: true,
    };
  } catch {
    return { site: sampleSite, usedAi: false };
  }
}

/** Sync helper for tests / demos that skip AI. */
export function generateSiteFromPlanSync(
  plan: SitePlan,
  preferences: SitePreferences
): GeneratedSite {
  return heuristicGenerate(plan, preferences);
}
