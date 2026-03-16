"use client";

import { Progress } from "@/components/ui/progress";

import { DashboardAnalyticsSnapshot } from "./types";
import { metricMeta } from "./utils";

const metricOrder = [
  "quickness",
  "introduction",
  "knowledge",
  "hospitality",
  "callToAction",
] as const;

export function DashboardBreakdownCard({
  analytics,
}: {
  analytics: DashboardAnalyticsSnapshot | null;
}) {
  return (
    <section className="self-start min-h-[30rem] rounded-3xl border bg-card/80 p-6 shadow-sm">
      <p className="text-2xl font-semibold tracking-tight">
        Criteria Breakdown
      </p>

      <div className="mt-8 space-y-6">
        {metricOrder.map((metric) => {
          const value = analytics?.currentMetrics[metric] ?? 0;
          return (
            <div
              key={metric}
              className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-4"
            >
              <p className="text-base font-medium">
                {metricMeta[metric].label}
              </p>
              <div className="rounded-full bg-muted/70 p-1">
                <Progress
                  value={value}
                  className="h-3 rounded-full bg-muted/80"
                />
              </div>
              <p className="w-10 text-right text-xl font-semibold tracking-tight">
                {analytics ? value : "—"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
