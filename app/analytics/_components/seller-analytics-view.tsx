"use client";

import { ReactNode } from "react";

import { AnalyticsEmptyState } from "./analytics-empty-state";
import { AnalyticsHeader } from "./analytics-header";
import { CloseRateCard } from "./close-rate-card";
import { HistoryNav } from "./history-nav";
import { MetricCards } from "./metric-cards";
import { ObjectionsCard } from "./objections-card";
import { PendingBanner } from "./pending-banner";
import { ScoreTrendCard } from "./score-trend-card";
import { AnalyticsDashboardSlice, MetricKey } from "./types";

export function SellerAnalyticsView({
  data,
  selectedMetric,
  onMetricChange,
  selectedIndex,
  onSelectIndex,
  emptyState,
}: {
  data: AnalyticsDashboardSlice | null;
  selectedMetric: MetricKey;
  onMetricChange: (metric: MetricKey) => void;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  emptyState?: ReactNode;
}) {
  const snapshots = data?.snapshots ?? [];
  const snapshot = snapshots[Math.min(selectedIndex, Math.max(snapshots.length - 1, 0))];

  return (
    <>
      <AnalyticsHeader metric={selectedMetric} onMetricChange={onMetricChange} />

      {data?.activePendingAnalysis ? (
        <PendingBanner activePendingAnalysis={data.activePendingAnalysis} />
      ) : null}

      {!data ? (
        <section className="mt-6 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Loading analytics...
        </section>
      ) : snapshots.length === 0 ? (
        emptyState ?? <AnalyticsEmptyState />
      ) : snapshot ? (
        <>
          <HistoryNav
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            onSelectIndex={onSelectIndex}
          />

          <div className="mt-6 grid gap-6">
            <ScoreTrendCard
              metric={selectedMetric}
              trendPoints={snapshot.trendPoints}
            />
            <MetricCards snapshot={snapshot} />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.95fr)]">
              <ObjectionsCard snapshot={snapshot} />
              <CloseRateCard snapshot={snapshot} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
