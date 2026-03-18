"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import {
  AnalyticsDashboardData,
  AnalyticsDashboardSlice,
  MetricKey,
} from "./_components/types";
import { OwnerAnalyticsView } from "./_components/owner-analytics-view";
import { SellerAnalyticsView } from "./_components/seller-analytics-view";

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
      {workspace.membership.role === "owner" ? (
        <OwnerAnalyticsView
          data={activeDashboard}
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
          selectedSeller={selectedSeller}
          onSelectedSellerChange={setSelectedSeller}
          sellerOptions={data?.sellerOptions ?? []}
        />
      ) : (
        <SellerAnalyticsView
          data={activeDashboard}
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
        />
      )}
    </AppShell>
  );
}
