"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  MessageSquareQuote,
  PhoneCall,
  PlusSquare,
} from "lucide-react";

type QuickAccessCard = {
  title: string;
  description: string;
  href: string;
  icon: typeof PhoneCall;
};

const quickAccessCards: QuickAccessCard[] = [
  {
    title: "Sales Calls",
    description:
      "Upload recordings, review calls, and open the latest analysis.",
    href: "/calls",
    icon: PhoneCall,
  },
  {
    title: "Analytics",
    description:
      "Track score trends, objection patterns, and close-rate movement.",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Feedback",
    description:
      "Review coaching actions, focus areas, and recommended materials.",
    href: "/feedback",
    icon: MessageSquareQuote,
  },
  {
    title: "Start New Call",
    description:
      "Jump into the call library and upload a fresh seller/client recording pair.",
    href: "/calls",
    icon: PlusSquare,
  },
];

export function DashboardQuickAccess() {
  return (
    <section className="self-start rounded-3xl border bg-card/80 p-6 shadow-sm min-h-[24rem]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold tracking-tight">Quick Access</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Jump straight into the workflows and resources you’ll use most.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {quickAccessCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-3xl border bg-background/40 p-5 transition-colors hover:border-primary/30 hover:bg-background/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-4 text-lg font-semibold tracking-tight">
                    {card.title}
                  </p>
                  <p className="mt-2 text-base text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
