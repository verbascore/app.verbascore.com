"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import {
  FeedbackDashboardData,
  FeedbackDashboardSlice,
} from "./_components/types";
import { OwnerFeedbackView } from "./_components/owner-feedback-view";
import { SellerFeedbackView } from "./_components/seller-feedback-view";

export default function FeedbackPage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const data = useQuery(
    api.feedback.getDashboard,
    workspace?.team ? {} : "skip",
  ) as
    | FeedbackDashboardData
    | undefined;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSeller, setSelectedSeller] = useState("average");

  const activeDashboard: FeedbackDashboardSlice | null = useMemo(() => {
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
      <AppShell activeHref="/feedback" title="Feedback">
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
      activeHref="/feedback"
      title="Feedback"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
    >
      {workspace.membership.role === "owner" ? (
        <OwnerFeedbackView
          data={activeDashboard}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
          selectedSeller={selectedSeller}
          onSelectedSellerChange={setSelectedSeller}
          sellerOptions={data?.sellerOptions ?? []}
        />
      ) : (
        <SellerFeedbackView
          data={activeDashboard}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
        />
      )}
    </AppShell>
  );
}
