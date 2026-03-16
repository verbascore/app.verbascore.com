export type MaterialType = "script" | "video" | "article" | "best_practice";

export type Material = {
  slug: string;
  title: string;
  type: MaterialType;
  summary: string;
  description: string;
  duration?: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
};

export const materialsCatalog: Material[] = [
  {
    slug: "perfect-introduction",
    title: "The Perfect Introduction",
    type: "script",
    summary:
      "A 3-part introduction framework that sets the right tone and establishes credibility within the first 30 seconds.",
    description:
      "Use this intro script to anchor the agenda, build relevance early, and signal confidence without sounding robotic. Includes opening examples for cold, warm, and inbound calls.",
    level: "Beginner",
    tags: ["Introduction", "Script", "Opening"],
  },
  {
    slug: "objection-handling-masterclass",
    title: "Objection Handling Masterclass",
    type: "video",
    summary:
      "25-minute video covering the acknowledge-bridge-benefit framework with real call examples.",
    description:
      "A practical walkthrough of how to slow the conversation down, acknowledge concerns, bridge back to the buyer's priorities, and reinforce value under pressure.",
    duration: "25 min",
    level: "Intermediate",
    tags: ["Objections", "Video", "Framework"],
  },
  {
    slug: "psychology-of-closing",
    title: "The Psychology of Closing",
    type: "article",
    summary:
      "Research-backed techniques for creating urgency without pressure. Includes 8 closing templates.",
    description:
      "Learn how to frame next steps, reduce decision drag, and invite commitment with language that feels collaborative instead of pushy.",
    level: "Advanced",
    tags: ["CTA", "Article", "Closing"],
  },
  {
    slug: "pricing-objection-playbook",
    title: "Pricing Objection Playbook",
    type: "script",
    summary:
      "Word-for-word responses to the 5 most common pricing objections with talk tracks and role-play scenarios.",
    description:
      "A practical script pack for handling price pushback while staying anchored in outcomes, tradeoffs, and total value delivered.",
    level: "Intermediate",
    tags: ["Pricing", "Objections", "Script"],
  },
  {
    slug: "closing-techniques-script",
    title: "Closing Techniques Script",
    type: "script",
    summary:
      "A closing script pack for confirming next steps, owners, and timelines without sounding forced.",
    description:
      "Includes soft close, assumption close, recap close, and follow-up booking language tailored for multi-stakeholder deals.",
    level: "Intermediate",
    tags: ["CTA", "Script", "Closing"],
  },
  {
    slug: "discovery-questions-that-convert",
    title: "Discovery Questions That Convert",
    type: "video",
    summary:
      "15-minute workshop on asking questions that uncover true pain points and buying signals.",
    description:
      "A short training for building question ladders that move from symptoms to business impact, helping you tailor the rest of the call more effectively.",
    duration: "15 min",
    level: "Intermediate",
    tags: ["Discovery", "Knowledge", "Video"],
  },
  {
    slug: "energy-management-for-sales",
    title: "Energy Management for Sales Reps",
    type: "best_practice",
    summary:
      "Strategies to maintain consistency and hospitality scores throughout the day.",
    description:
      "A best-practice guide for preserving warmth, patience, and clarity across back-to-back calls, especially later in the afternoon.",
    level: "Beginner",
    tags: ["Hospitality", "Wellness", "Best Practice"],
  },
  {
    slug: "discovery-and-product-mapping-guide",
    title: "Discovery and Product Mapping Guide",
    type: "article",
    summary:
      "A guide to connecting product capabilities directly to the buyer's stated use case.",
    description:
      "Avoid feature-dumping by learning how to map each capability to pain points, business outcomes, and stakeholder priorities.",
    level: "Intermediate",
    tags: ["Knowledge", "Article", "Discovery"],
  },
  {
    slug: "fast-opening-checklist",
    title: "Fast Opening Checklist",
    type: "best_practice",
    summary:
      "A simple pre-call checklist to shorten ramp time and get to meaningful discovery faster.",
    description:
      "Use this operational checklist before and during the first 60 seconds of the call to reduce dead air and reach value sooner.",
    level: "Beginner",
    tags: ["Quickness", "Best Practice", "Opening"],
  },
];

export const materialTypeMeta: Record<
  MaterialType,
  { label: string; shortLabel: string }
> = {
  script: { label: "Scripts", shortLabel: "Script" },
  video: { label: "Videos", shortLabel: "Video" },
  article: { label: "Articles", shortLabel: "Article" },
  best_practice: { label: "Best Practices", shortLabel: "Best Practice" },
};

export function getMaterialByTitle(title: string) {
  return materialsCatalog.find((material) => material.title === title) ?? null;
}

export function getMaterialBySlug(slug: string) {
  return materialsCatalog.find((material) => material.slug === slug) ?? null;
}
