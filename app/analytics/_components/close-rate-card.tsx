"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { AnalyticsSnapshot } from "./types";

const chartConfig = {
  closeRate: {
    label: "Close Rate",
    theme: {
      light: "#4d7c0f",
      dark: "#84cc16",
    },
  },
} satisfies ChartConfig;

export function CloseRateCard({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  return (
    <section className="rounded-3xl border bg-card/80 p-6 shadow-sm">
      <p className="text-base font-semibold tracking-tight">Close Rate Trend</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Heuristic close-rate estimate derived from overall score, hospitality,
        and call to action.
      </p>

      <div className="mt-6">
        <ChartContainer config={chartConfig} className="h-[340px] w-full">
          <AreaChart
            data={snapshot.trendPoints}
            margin={{ left: 12, right: 12 }}
          >
            <defs>
              <linearGradient id="fill-close-rate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-closeRate)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-closeRate)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[0, 60]}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area
              type="monotone"
              dataKey="closeRate"
              stroke="var(--color-closeRate)"
              fill="url(#fill-close-rate)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </section>
  );
}
