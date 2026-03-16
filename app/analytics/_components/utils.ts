import { MetricKey } from "./types";

export function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export const metricMeta: Record<
  MetricKey,
  { label: string; color: string; darkColor: string }
> = {
  overallRating: {
    label: "Overall Score",
    color: "#0891b2",
    darkColor: "#06b6d4",
  },
  quickness: {
    label: "Quickness",
    color: "#0891b2",
    darkColor: "#22d3ee",
  },
  introduction: {
    label: "Introduction",
    color: "#0e7490",
    darkColor: "#67e8f9",
  },
  knowledge: {
    label: "Knowledge",
    color: "#4d7c0f",
    darkColor: "#84cc16",
  },
  hospitality: {
    label: "Hospitality",
    color: "#c2410c",
    darkColor: "#fb923c",
  },
  callToAction: {
    label: "Call to Action",
    color: "#ea580c",
    darkColor: "#fb7185",
  },
};

export function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} pts`;
}
