"use client";

import { PageHeader } from "@/components/page-header";
import { MetricKey } from "./types";
import { metricMeta } from "./utils";

type AnalyticsHeaderProps = {
  metric: MetricKey;
  onMetricChange: (metric: MetricKey) => void;
};

export function AnalyticsHeader({
  metric,
  onMetricChange,
}: AnalyticsHeaderProps) {
  const metrics: MetricKey[] = [
    "overallRating",
    "quickness",
    "introduction",
    "knowledge",
    "hospitality",
    "callToAction",
  ];

  return (
    <PageHeader
      eyebrow="Performance"
      title="Analytics"
      description="Compare score trends, conversion signals, and objection patterns over time across your shared call history."
    >
      <div className="flex flex-wrap gap-2">
          {metrics.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onMetricChange(item)}
              className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors ${
                metric === item
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {metricMeta[item].label}
            </button>
          ))}
      </div>
    </PageHeader>
  );
}
