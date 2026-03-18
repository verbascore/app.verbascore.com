"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import { AnalyticsEmptyState } from "./_components/analytics-empty-state";
import { AnalyticsHeader } from "./_components/analytics-header";
import { AnalyticsDashboardData, MetricKey } from "./_components/types";
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

  const snapshots = data?.snapshots ?? [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [snapshots.length]);

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
    return (
      <AppShell activeHref="/analytics" title="Analytics">
        <TeamEmptyState />
      </AppShell>
    );
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
      />

      {data?.activePendingAnalysis ? (
        <PendingBanner activePendingAnalysis={data.activePendingAnalysis} />
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
