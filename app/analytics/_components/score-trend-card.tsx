"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { MetricKey, TrendPoint } from "./types";
import { metricMeta } from "./utils";

type ScoreTrendCardProps = {
  metric: MetricKey;
  trendPoints: TrendPoint[];
};

export function ScoreTrendCard({ metric, trendPoints }: ScoreTrendCardProps) {
  const config = {
    [metric]: {
      label: metricMeta[metric].label,
      theme: {
        light: metricMeta[metric].color,
        dark: metricMeta[metric].darkColor,
      },
    },
  } satisfies ChartConfig;

  return (
    <section className="rounded-3xl border bg-card/80 p-6 shadow-sm">
      <p className="text-base font-semibold tracking-tight">Score Trend</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Tracking {metricMeta[metric].label.toLowerCase()} across the latest
        analyzed calls.
      </p>

      <div className="mt-6">
        <ChartContainer config={config} className="h-[420px] w-full">
          <LineChart
            data={trendPoints}
            margin={{ left: 12, right: 12, top: 10 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[40, 100]}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={`var(--color-${metric})`}
              strokeWidth={3}
              dot={{ fill: `var(--color-${metric})`, r: 4 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </section>
  );
}
