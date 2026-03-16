"use client";

import { Line, LineChart } from "recharts";

import { ChartConfig, ChartContainer } from "@/components/ui/chart";

import { AnalyticsSnapshot, MetricKey } from "./types";
import { formatDelta, metricMeta } from "./utils";

const metricKeys: MetricKey[] = [
  "quickness",
  "introduction",
  "knowledge",
  "hospitality",
  "callToAction",
];

export function MetricCards({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-5">
      {metricKeys.map((metric) => {
        const config = {
          [metric]: {
            label: metricMeta[metric].label,
            theme: {
              light: metricMeta[metric].color,
              dark: metricMeta[metric].darkColor,
            },
          },
        } satisfies ChartConfig;

        const delta = snapshot.metricDeltas[metric];

        return (
          <article
            key={metric}
            className="rounded-3xl border bg-card/80 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {metricMeta[metric].label}
                </p>
                <p className="mt-3 text-lg font-semibold tracking-tight">
                  {snapshot.currentMetrics[metric]}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <ChartContainer config={config} className="h-16 w-full">
                <LineChart data={snapshot.trendPoints}>
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke={`var(--color-${metric})`}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            <p
              className={`mt-3 text-sm font-medium ${
                delta >= 0 ? "text-lime-400" : "text-rose-400"
              }`}
            >
              {delta >= 0 ? "↑" : "↓"} {formatDelta(delta)}
            </p>
          </article>
        );
      })}
    </section>
  );
}
