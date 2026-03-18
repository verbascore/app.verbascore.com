"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { SellerScopeSelector } from "@/components/seller-scope-selector";
import { TeamEmptyState } from "@/components/team-empty-state";

import { AnalyticsEmptyState } from "./_components/analytics-empty-state";
import { AnalyticsHeader } from "./_components/analytics-header";
import {
  AnalyticsDashboardData,
  AnalyticsDashboardSlice,
  MetricKey,
} from "./_components/types";
import { CloseRateCard } from "./_components/close-rate-card";
import { HistoryNav } from "./_components/history-nav";
import { MetricCards } from "./_components/metric-cards";
import { ObjectionsCard } from "./_components/objections-card";
import { PendingBanner } from "./_components/pending-banner";
import { ScoreTrendCard } from "./_components/score-trend-card";

export default function AnalyticsPage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const data = useQuery(
    api.analytics.getDashboard,
    workspace?.team ? {} : "skip",
  ) as
    | AnalyticsDashboardData
    | undefined;
  const [selectedMetric, setSelectedMetric] =
    useState<MetricKey>("overallRating");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSeller, setSelectedSeller] = useState("average");

  const activeDashboard: AnalyticsDashboardSlice | null = useMemo(() => {
    if (!workspace?.membership || !data) {
      return null;
    }

    if (workspace.membership.role !== "owner") {
      return {
        snapshots: data.snapshots,
        activePendingAnalysis: data.activePendingAnalysis,
      };
    }

    if (selectedSeller === "average") {
      return data.averageDashboard;
    }

    return data.dashboardsBySeller[selectedSeller] ?? null;
  }, [data, selectedSeller, workspace?.membership]);

  const snapshots = activeDashboard?.snapshots ?? [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [snapshots.length]);

  useEffect(() => {
    if (
      workspace?.membership?.role === "owner" &&
      selectedSeller !== "average" &&
      !(data?.dashboardsBySeller?.[selectedSeller])
    ) {
      setSelectedSeller("average");
    }
  }, [data?.dashboardsBySeller, selectedSeller, workspace?.membership?.role]);

  const snapshot = useMemo(
    () => snapshots[Math.min(selectedIndex, Math.max(snapshots.length - 1, 0))],
    [selectedIndex, snapshots],
  );

  if (!workspace) {
    return (
      <AppShell activeHref="/analytics" title="Analytics">
        <section className="mt-6 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Loading workspace...
        </section>
      </AppShell>
    );
  }

  if (!workspace.team || !workspace.membership) {
    return <TeamEmptyState />;
  }

  return (
    <AppShell
      activeHref="/analytics"
      title="Analytics"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
    >
      <AnalyticsHeader
        metric={selectedMetric}
        onMetricChange={setSelectedMetric}
        scopeControl={
          workspace.membership.role === "owner" ? (
            <SellerScopeSelector
              label="Seller"
              value={selectedSeller}
              onValueChange={setSelectedSeller}
              sellers={data?.sellerOptions ?? []}
              averageLabel="Average across sellers"
            />
          ) : undefined
        }
      />

      {activeDashboard?.activePendingAnalysis ? (
        <PendingBanner activePendingAnalysis={activeDashboard.activePendingAnalysis} />
      ) : null}

      {!data ? (
        <section className="mt-6 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Loading analytics...
        </section>
      ) : snapshots.length === 0 ? (
        <AnalyticsEmptyState />
      ) : snapshot ? (
        <>
          <HistoryNav
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
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
    </AppShell>
  );
}
