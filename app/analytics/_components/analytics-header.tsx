"use client";

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
    <section className="rounded-3xl border bg-card/90 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Deep dive into your performance metrics
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Analytics
          </h2>
        </div>

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
      </div>
    </section>
  );
}
