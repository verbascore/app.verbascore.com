"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { AnalyticsSnapshot } from "./types";

const chartConfig = {
  count: {
    label: "Mentions",
    theme: {
      light: "#0f766e",
      dark: "#14b8a6",
    },
  },
} satisfies ChartConfig;

export function ObjectionsCard({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  return (
    <section className="rounded-3xl border bg-card/80 p-6 shadow-sm">
      <p className="text-base font-semibold tracking-tight">Top Objections</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Most common objections captured across the calls in this snapshot.
      </p>

      {snapshot.topObjections.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-background/40 p-8 text-sm text-muted-foreground">
          No objections were marked in the included calls.
        </div>
      ) : (
        <div className="mt-6">
          <ChartContainer config={chartConfig} className="h-[340px] w-full">
            <BarChart
              data={snapshot.topObjections}
              layout="vertical"
              margin={{ left: 24, right: 12 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={160}
              />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Bar
                dataKey="count"
                radius={8}
                fill="var(--color-count)"
                barSize={36}
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}
