/**
 * Every word on the site.
 *
 * The old build kept copy inline in a 2,400-line HTML file, which was fine
 * while there was one page. With five routes and a shared layout, inline copy
 * is how two pages end up disagreeing about the same fact — the failure the
 * AJ2054 committee roster hit when it lived in two hand-synced HTML files.
 *
 * Anything Enrico edits, he edits here.
 */

export const SITE = {
  name: "Enrico Omri Ravenna",
  /** The one-line positioning claim. Sits under the name in the hero. */
  positioning: "Jewish Communal Leader",
  domain: "https://enricoravenna.com",
  linkedin: "https://www.linkedin.com/in/enricoravenna",
  email: "enricoravenna1@gmail.com",
  /** +1 (404) 313-8395, digits only for the wa.me link. */
  whatsapp: "14043138395",
  resume: "/Enrico Ravenna Resume.pdf",
  quote: {
    text: `"Where there is a possibility,\nthere's a responsibility"`,
    byline: "Enrico Omri Ravenna",
  },
  background: [
    "Israeli American Council",
    "Maccabee Task Force",
    "Jewish Federation of Arkansas",
  ],
} as const;

/** Rotating strip above the nav. */
export const BANNER_MESSAGES = [
  "Available for board, advisory, and speaking inquiries",
  "Jewish communal thought leader · Strategic partner",
  "Seeking the next large-city Federation CEO role",
] as const;

export const NAV = [
  { href: "/story", label: "Story" },
  { href: "/voices", label: "Voices" },
  { href: "/work", label: "Work" },
  { href: "/vision", label: "Vision" },
] as const;

/**
 * Reading order, used by the prev/next control at the foot of each page.
 * Splitting one scroll into five routes removes the thing a long page gives
 * you for free: a reader who keeps going. This puts it back.
 */
export const READING_ORDER = ["/", "/story", "/voices", "/work", "/vision"] as const;

export const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/story": "The Story",
  "/voices": "Voices",
  "/work": "The Work",
  "/vision": "The Vision",
};

/* ─────────────────────────────────────────────────────────────────
   STORY
   ───────────────────────────────────────────────────────────────── */

export type Chapter = {
  id: string;
  label: string;
  headline: string;
  /** Rendered italic in the section accent. */
  headlineAccent: string;
  body: string[];
  photo: string;
  alt: string;
  /** Which side the photo sits on at desktop widths. */
  side: "left" | "right";
};

export const CHAPTERS: Chapter[] = [
  {
    id: "soldier",
    label: "01 — Soldier",
    headline: "The",
    headlineAccent: "Soldier.",
    body: [
      "I was born in Israel. I served in the IDF and was honorably discharged as a First Sergeant. That service is where I learned what accountability looks like when the stakes are real.",
      "Everything I have built since starts there.",
    ],
    photo: "/photo-idf.jpg",
    alt: "Enrico Omri Ravenna serving in the IDF, Negev desert",
    side: "left",
  },
  {
    id: "builder",
    label: "02 — Builder",
    headline: "The",
    headlineAccent: "Builder.",
    body: [
      "After spending a few years in the United States I realized how important honoring the sense of community and my culture intentionally had become. This led to seeking out ways to engage and connect with others and starting my career in the Jewish nonprofit space. I started where the whole community was. At the Israeli American Council in Atlanta, I served as Activism Manager for the Southeast, mobilizing Jewish identity and civic engagement across an entire region, working with donors, organizers, and leaders across every demographic, not a single population.",
      "Then I deliberately narrowed. As Midwest Regional Director and Associate Director of Israel Trips at Maccabee Task Force, I went deep into campuses — leading students to Israel, training the next generation in advocacy and interpersonal leadership, building from the ground up. I graduated Cum Laude in Political Science from Georgia State University. Mission and profession became the same thing.",
    ],
    photo: "/photo-mtf.jpg",
    alt: "Enrico leading students on an Israel trip",
    side: "left",
  },
  {
    id: "leader",
    label: "03 — Leader",
    headline: "The",
    headlineAccent: "Leader.",
    body: [
      "I led the Jewish Federation of Arkansas from 2025 to 2026. A lean team. An outsized mission. In just over a year we tripled programming, rebuilt a dormant donor base, forged security partnerships across law enforcement and government, and put Arkansas on the national Jewish communal map.",
      "The community is small. The stakes are not.",
    ],
    photo: "/photo-leader.jpg",
    alt: "Enrico Omri Ravenna on stage, arm raised",
    side: "right",
  },
];

export const INTERLUDE = {
  kicker: "The Thread That Runs Through It",
  pull: `"My grandparents survived the Holocaust because a Catholic priest hid them from the Nazis."`,
  body: "That is one of many reasons I sit across the table from pastors and legislators and neighbors who do not share my faith. That is why “where there is a possibility, there's a responsibility” is not a bumper sticker. It is the only honest response to the inheritance I carry.",
} as const;

/* ─────────────────────────────────────────────────────────────────
   VOICES
   ───────────────────────────────────────────────────────────────── */

export type Testimonial = {
  name: string;
  title: string[];
  photo?: string;
  alt?: string;
  /** `true` renders larger and in full white. */
  body: { text: string; highlight?: boolean }[];
};

export const FIELD_VOICE: Testimonial & { stats: { num: string; label: string }[] } = {
  name: "Lt. Col. (Res.) Eyal Dror",
  title: ["Founder & Commander, Operation Good Neighbor", "IDF Northern Command · 31 Years of Service"],
  photo: "/photo-eyal.jpg",
  alt: "Lt. Col. (Res.) Eyal Dror, Commander of Operation Good Neighbor",
  stats: [
    { num: "700", label: "Humanitarian Missions" },
    { num: "4,500", label: "Syrians Treated in Israel" },
    { num: "420", label: "White Helmets Rescued" },
  ],
  body: [
    {
      text: "He is a deeply committed Zionist who understands that educating the next generation requires not only words, but presence, responsibility, and leadership.",
      highlight: true,
    },
    {
      text: "What makes Enrico especially unique is that he is both profoundly connected to American Jewish life and genuinely Israeli in his experience and outlook, including through his meaningful military service. This rare combination enables him to understand both communities from within and to build authentic bridges between them.",
    },
    {
      text: "Enrico is a dedicated and highly professional leader who, in my view, deserves to become one of the leading Jewish voices in the United States, and I am proud to call him my friend, to have hosted him and his family in my home, and to support the important path he is leading.",
      highlight: true,
    },
  ],
};

export const COLLEAGUES: Testimonial[] = [
  {
    name: "Jordenne Parker",
    title: ["Associate Director", "UT Austin Hillel"],
    photo: "/photo-jordenne.jpg",
    alt: "Jordenne Parker, Associate Director, UT Austin Hillel",
    body: [
      {
        text: "I've had the privilege of partnering with Enrico on multiple geopolitical trips to Israel, including leading the first Maccabee Task Force campus delegation to return after October 7.",
        highlight: true,
      },
      {
        text: "He never asks people to stop asking hard questions. Instead, he helps them ask better ones. I've watched students leave conversations with Enrico feeling more confident in their own voices, more curious about complexity, and more willing to engage thoughtfully with their communities back on campus.",
      },
      {
        text: "He has an extraordinary ability to balance empathy with honesty, creating spaces where students can challenge assumptions without ever feeling judged. His leadership is rooted in humility, genuine curiosity, and an unwavering belief in people's potential.",
      },
      {
        text: "What has always stood out to me is that he doesn't seek out the easy path. He embraces challenges because he knows they are opportunities to learn, adapt, and become better. Watching that growth has been just as inspiring as experiencing the impact he has on students.",
        highlight: true,
      },
    ],
  },
  {
    name: "Jessie Dowsakul",
    title: ["Executive Director", "Columbia Jewish Federation"],
    photo: "/photo-jessie.jpg",
    alt: "Jessie Dowsakul, Executive Director of the Columbia Jewish Federation",
    body: [
      { text: "Working with Enrico has changed the way I think about leadership.", highlight: true },
      {
        text: "He has an incredible ability to see potential — in organizations, in leaders, and in communities that are often overlooked. More importantly, he knows how to help people turn that potential into action.",
      },
      {
        text: "What sets him apart is that he leads with humility. He doesn't seek recognition or try to be the loudest voice in the room. He listens first, asks thoughtful questions, and creates space for others to grow. He has a unique gift for making people feel seen, valued, and capable of accomplishing more than they thought possible.",
      },
      {
        text: "He challenged me to think bigger, dream bolder, and never accept that being a smaller community meant we had to think small.",
      },
      {
        text: "Enrico believes deeply in people. He believes in communities. And he believes that leadership is about lifting others up. That belief is contagious, and it has made me a better leader.",
        highlight: true,
      },
    ],
  },
];

export const TEAM_VOICES: Testimonial[] = [
  {
    name: "Erin Cohen",
    title: ["Community Engagement Manager, Jewish Federation of Arkansas"],
    body: [
      {
        text: "He consistently trusted and empowered me to focus on the needs of Northwest Arkansas — and advocated successfully with the Executive Board to expand my role, allowing me to take on more meaningful work in programming, outreach, relationship-building, and long-term community engagement.",
      },
      {
        text: "Enrico's trust-based leadership gives me the autonomy to focus on the needs of Northwest Arkansas while ensuring I have what I need to build and engage community. I believe his leadership has helped create momentum for the continued growth of Jewish life in Northwest Arkansas — and for the work our community needs and deserves.",
        highlight: true,
      },
    ],
  },
  {
    name: "Wendy Paquette",
    title: ["Office Manager, Jewish Federation of Arkansas"],
    body: [
      {
        text: "What he brings to an organization is something that cannot be taught — he simply has it. His passion, energy, and ability to envision what is possible are both remarkable and contagious.",
        highlight: true,
      },
      {
        text: "He approaches challenges with optimism and resilience, seeing obstacles as opportunities rather than setbacks… One of Enrico's greatest strengths as a manager is the trust he places in his team. Rather than micromanaging, he provides steadfast support, encouragement, and advocacy for his staff — ensuring employees always know they have a leader who is invested in their success.",
      },
    ],
  },
];

export const COMMUNITY_VOICES = [
  {
    name: "Dr. Cathie Dorsch, PhD",
    title: "CEO, Commission Fields · Judeo-Christian Studies & Ethics",
    photo: "/photo-cathie.jpg",
    alt: "Dr. Cathie Dorsch with Enrico Ravenna",
    quote:
      "He is a skilled communicator and a builder of generational unity who is unafraid of hard conversations. His leadership drew out new and younger leaders who had been discounted and marginalized. He is a passionate and courageous representative of Jewish identity, of American ideals, of shared Judeo-Christian values, and of the existential necessity for a strong Israel.",
  },
  {
    name: "Pastor Perry Black",
    title: "Founding Pastor · Family Church Bryant",
    photo: "/photo-perry.jpg",
    alt: "Pastor Perry Black with Enrico Ravenna",
    quote:
      "I do not know of a more important time in my life to have such a dynamic and energetic bridge builder for the Jewish community like Enrico Ravenna.",
  },
] as const;

/* ─────────────────────────────────────────────────────────────────
   WORK
   ───────────────────────────────────────────────────────────────── */

export const INITIATIVES = [
  {
    id: "reut-spotlight",
    kicker: "National Work",
    headline: "AJ 2026 — Toward a Decade of Renewal of",
    headlineAccent: "American Jewry.",
    body: "In March 2026 I was invited to the Reut USA American Jewry Un-Conference in Miami as part of AJ 2026, a gathering of national Jewish leadership focused on the decade ahead. I made the case that the future of American Jewry runs through communities like Arkansas, not only the major metros. Small communities are not the margins of the Jewish world. They are where the next chapter gets written.",
    cta: { label: "View AJ 2026", href: "https://aj-2026.vercel.app/" },
    photo: "/photo-reut.jpg",
    alt: "Enrico Omri Ravenna at AJ 2026 — Toward a Decade of Renewal of American Jewry, Miami",
    /** Widescreen frame, contained rather than cropped. */
    fit: "contain" as const,
    accent: "bone" as const,
  },
  {
    id: "spotlight",
    kicker: "At the Federation",
    headline: "Campus leadership at the",
    headlineAccent: "University of Arkansas.",
    body: "The next generation of Jewish leaders is already on campus. Through Hillel at the University of Arkansas, we invested in student leaders, funded development opportunities, and built the pipeline of young people who will run Jewish communities a decade from now. We did not wait for them to find us.",
    cta: { label: "Learn More", href: "https://jewisharkansas.org" },
    photo: "/photo-campus.jpg",
    alt: "Enrico Omri Ravenna with students at University of Arkansas",
    fit: "cover" as const,
    accent: "red" as const,
  },
  {
    id: "elswick-spotlight",
    kicker: "Local Media",
    headline: "A regular voice on",
    headlineAccent: "The Dave Elswick Show.",
    body: "I appeared regularly on The Dave Elswick Show on KARK/iHeart Radio as the go-to Jewish community voice in Arkansas. Every appearance is a chance to bring Israel, antisemitism, and Jewish community life into a conversation that reaches well beyond our walls. That reach matters. Influence does not stop at the synagogue door.",
    /** No link until there is a real show URL. Deliberate. */
    cta: null,
    photo: "/photo-elswick.jpg",
    alt: "Enrico Omri Ravenna at The Dave Elswick Show studio, KARK iHeart Radio, Arkansas",
    fit: "cover" as const,
    accent: "red" as const,
  },
];

/** `icon` keys map to the SVG paths in components/area-icon.tsx. */
export const AREAS = [
  {
    icon: "shield",
    title: "Community Security",
    desc: "Emergency protocols, government grant acquisition, and security infrastructure built before something happens, not scrambled together after.",
  },
  {
    icon: "rings",
    title: "Interfaith Coalitions",
    desc: "Durable relationships with pastors, priests, mosques, and legislators that outlast any single program or administration.",
  },
  {
    icon: "chart",
    title: "Fundraising & Development",
    desc: "Rebuilding donor trust from scratch, re-engaging lapsed supporters, and finding net-new funders. Starting from a cold list with no prior pipeline.",
  },
  {
    icon: "target",
    title: "Next-Gen Leadership",
    desc: "Identifying and placing emerging Jewish leaders in staff, board, and national roles. People who had never considered this path as available to them.",
  },
  {
    icon: "star",
    title: "Israel Advocacy",
    desc: "Public Jewish presence, Israel education, Holocaust remembrance, and advocacy in rooms where our community is rarely represented but always discussed.",
  },
  {
    icon: "refresh",
    title: "Organizational Turnaround",
    desc: "Coming into a community that's falling behind and building it back. Culture, governance, operations. Making a small team punch above its weight.",
  },
] as const;

export const TICKER = [
  "Governance", "Fundraising", "Interfaith", "Security", "Advocacy",
  "Mentorship", "Next-Gen Leadership", "Israel", "Community", "Coalition Building",
] as const;

export const NUMBERS = [
  {
    value: 4,
    display: "4",
    text: "institutional security partnerships built and maintained — with the Secure Community Network, the FBI, the Little Rock Police Department, and the Arkansas state legislature. Relationships, not just protocols.",
  },
  {
    value: 30,
    suffix: " min",
    display: "30 min",
    text: "Within 30 minutes of a mass shooting at a Jewish congregation in Michigan, I had activated every congregation in Arkansas, coordinated with the FBI, and ensured every Jewish institution had eyes on their doors. Then we made that response permanent.",
  },
  {
    value: 700,
    suffix: "+",
    display: "700+",
    text: "community engagements across 18 programs in a single fiscal year — tripled from near-zero when I arrived. Because we built relationships first and let programming follow where people actually were.",
  },
  {
    value: 55,
    suffix: "%",
    display: "55%",
    text: "newsletter open rate — more than double the 25% national nonprofit average. The number reflects one thing: I write to people, not at them.",
  },
  {
    value: 19,
    display: "19",
    text: "net-new donors in our first active campaign after years of dormancy, plus 40 returning donors re-engaged. First year. No prior pipeline. No inherited list.",
  },
] as const;

/* ─────────────────────────────────────────────────────────────────
   VISION
   ───────────────────────────────────────────────────────────────── */

export const ARC_THESIS =
  "I started with an |entire community|, narrowed into a single generation on campus, and now lead an entire state, and I'm not done growing.";

export const VISION_PULL = {
  quote: "There's safety in familiarity, and a great opportunity in the pursuit of it.",
  cite: "Enrico Omri Ravenna",
} as const;

export const VISION_BEATS = [
  {
    statement: "Relationship over transaction.",
    body: "Every relationship I have built started with a conversation, not a program. I go deeper with fewer people rather than wider with more. The communities that survive long-term are the ones where people actually know each other.",
  },
  {
    statement: "Security without losing joy.",
    body: "Good security means people still show up. They still light candles in public, still send their kids to Hebrew school, still celebrate in community. Fear wins the moment people stop gathering. My job is to make sure that never happens.",
  },
  {
    statement: "The next generation leads now.",
    body: "The next generation does not need to earn their seat at the table. They are already doing the work. Give them real responsibility and they will run with it. I have watched it happen. That is what I keep building toward.",
  },
] as const;

/**
 * ⚠️ These still point at the LinkedIn profile rather than real post
 * permalinks. Replace `href` with the full https://www.linkedin.com/posts/…
 * URL from each post's timestamp link.
 */
export const INSIGHTS = [
  {
    tag: "Leadership",
    title: "Why small Jewish communities are the future of Federation work",
    href: SITE.linkedin,
    tone: "red" as const,
  },
  {
    tag: "Security",
    title: "The FBI called. Here's what every Jewish institution should know about security",
    href: SITE.linkedin,
    tone: "bone" as const,
  },
  {
    tag: "Interfaith",
    title: "A priest saved my family. Here's why I never stop building bridges",
    href: SITE.linkedin,
    tone: "gray" as const,
  },
] as const;

export const CTA = {
  label: "Let's Connect",
  headline: "Ready to build something that matters.",
  sub: "If you're working on something serious in the Jewish nonprofit space, I want to hear about it.",
} as const;

/**
 * The accessibility statement.
 *
 * Every claim under `does` was verified against this codebase, and the
 * contrast figures are the measured ratios recorded in globals.css. That is
 * the only reason `gaps` is here too: a statement that lists strengths and
 * no limits reads as marketing, and an accessibility statement that
 * overstates is worse than not having one. If the site changes, re-check
 * these rather than letting the page drift.
 */
export const A11Y = {
  standard: "WCAG 2.2 Level AA",
  reviewed: "15 August 2026",

  does: [
    {
      heading: "Keyboard access",
      body: "Every interactive element is reachable by keyboard and shows a visible focus ring, offset far enough from the element that it never clips. A skip link is the first thing focus lands on, and it jumps straight past the navigation to the main content.",
    },
    {
      heading: "Reduced motion",
      body: "The site reads your system's reduced-motion setting. With it on, animation stops and the scroll-driven career sequence becomes the same five beats as a plain list. It is the same argument delivered without the ride, not a stripped-down version of it.",
    },
    {
      heading: "Colour contrast",
      body: "Every text colour is measured against the background it sits on and the ratio is recorded in the stylesheet. Body text is 17.7:1, secondary text 6.8:1, and the red accent 5.2:1. The AA threshold is 4.5:1.",
    },
    {
      heading: "Structure and semantics",
      body: "One first-level heading per page, headings in order beneath it, landmark regions around the navigation, main content and footer, a declared page language, and alt text on every image. Decorative graphics are hidden from assistive technology so they are not read out as noise.",
    },
    {
      heading: "The career sequence",
      body: "The five beats stay in the page markup the whole time rather than appearing at a particular scroll position, so a screen reader receives the sequence as one continuous block. A link inside it skips the whole thing.",
    },
  ],

  gaps: [
    {
      heading: "No independent audit",
      body: "The checks above were run against the code by hand. No third party has reviewed this site and there is no VPAT behind it. Treat the claims as specific and testable, not as certified.",
    },
    {
      heading: "The resume PDF is untagged",
      body: "It carries no document structure, so a screen reader reads it as loose text with no headings or reading order. Email me and I will send the same content in a format that works for you.",
    },
    {
      heading: "The career sequence is a long scroll on a phone",
      body: "The skip link inside it is the honest fix and it helps. The sequence is still long on a small screen.",
    },
    {
      heading: "The globe needs WebGL",
      body: "The animated globe requires a browser with WebGL enabled. Turning on reduced motion loads the static version, which needs no WebGL at all.",
    },
  ],
} as const;
