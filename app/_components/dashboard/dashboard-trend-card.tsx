"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { DashboardAnalyticsSnapshot } from "./types";

const chartConfig = {
  overallRating: {
    label: "Overall Score",
    theme: {
      light: "#0f766e",
      dark: "#06b6d4",
    },
  },
} satisfies ChartConfig;

export function DashboardTrendCard({
  analytics,
}: {
  analytics: DashboardAnalyticsSnapshot | null;
}) {
  return (
    <section className="self-start min-h-[30rem] rounded-3xl border bg-card/80 p-6 shadow-sm">
      <p className="text-2xl font-semibold tracking-tight">
        Score Trend (30 Days)
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {analytics
          ? "Overall score across the most recently analyzed calls."
          : "Analyze calls to unlock trend data."}
      </p>

      <div className="mt-6">
        <ChartContainer config={chartConfig} className="h-[360px] w-full">
          <LineChart
            data={analytics?.trendPoints ?? []}
            margin={{ left: 12, right: 12, top: 10 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[50, 100]}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Line
              type="monotone"
              dataKey="overallRating"
              stroke="var(--color-overallRating)"
              strokeWidth={3}
              dot={{ fill: "var(--color-overallRating)", r: 4 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </section>
  );
}
