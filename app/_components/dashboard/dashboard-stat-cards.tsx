"use client";

import { Activity, BarChart3, PhoneCall, TrendingUp } from "lucide-react";

import { DashboardAnalyticsSnapshot } from "./types";
import { formatDelta } from "./utils";

type DashboardStatCardsProps = {
  analytics: DashboardAnalyticsSnapshot | null;
  analyzedCallsCount: number;
};

export function DashboardStatCards({
  analytics,
  analyzedCallsCount,
}: DashboardStatCardsProps) {
  const overallDelta = analytics?.metricDeltas.overallRating ?? 0;
  const closeRate = analytics?.currentMetrics.closeRate ?? 0;
  const closeRateDelta = analytics?.metricDeltas.closeRate ?? 0;

  const cards = [
    {
      label: "Overall Score",
      value: analytics ? String(analytics.currentMetrics.overallRating) : "—",
      helper: analytics
        ? `${formatDelta(overallDelta)} vs last snapshot`
        : "Waiting for analyzed calls",
      icon: Activity,
      accent: overallDelta >= 0 ? "text-lime-400" : "text-rose-400",
    },
    {
      label: "Calls Reviewed",
      value: String(analyzedCallsCount),
      helper:
        analyzedCallsCount > 0
          ? "Calls with completed analysis"
          : "No analyzed calls yet",
      icon: PhoneCall,
      accent: "text-muted-foreground",
    },
    {
      label: "Trend",
      value: analytics
        ? `${overallDelta >= 0 ? "+" : ""}${overallDelta}%`
        : "—",
      helper: analytics
        ? overallDelta >= 0
          ? "Improving"
          : "Needs attention"
        : "No trend yet",
      icon: TrendingUp,
      accent: overallDelta >= 0 ? "text-lime-400" : "text-rose-400",
    },
    {
      label: "Close Rate",
      value: analytics ? `${closeRate}%` : "—",
      helper: analytics
        ? `${formatDelta(closeRateDelta)} vs last snapshot`
        : "Waiting for analyzed calls",
      icon: BarChart3,
      accent: closeRateDelta >= 0 ? "text-lime-400" : "text-rose-400",
    },
  ];

  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="self-start min-h-[11rem] rounded-3xl border bg-card/80 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-5xl font-semibold tracking-tight">
                    {card.value}
                  </p>
                </div>
                <p className={`mt-4 text-sm ${card.accent}`}>{card.helper}</p>
              </div>
              <Icon className="size-5 text-muted-foreground" />
            </div>
          </article>
        );
      })}
    </section>
  );
}
