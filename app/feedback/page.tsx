"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import { FeedbackDashboardData } from "./_components/types";
import { FeedbackEmptyState } from "./_components/feedback-empty-state";
import { FeedbackHeader } from "./_components/feedback-header";
import { FeedbackHistoryNav } from "./_components/feedback-history-nav";
import { FeedbackPendingBanner } from "./_components/feedback-pending-banner";
import { FocusCard } from "./_components/focus-card";
import { RecommendationCard } from "./_components/recommendation-card";

export default function FeedbackPage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const data = useQuery(
    api.feedback.getDashboard,
    workspace?.team ? {} : "skip",
  ) as
    | FeedbackDashboardData
    | undefined;
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
      <FeedbackHeader />

      {data?.activePendingAnalysis ? (
        <FeedbackPendingBanner
          activePendingAnalysis={data.activePendingAnalysis}
        />
      ) : null}

      {!data ? (
        <section className="mt-6 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Loading feedback...
        </section>
      ) : snapshots.length === 0 ? (
        <FeedbackEmptyState />
      ) : snapshot ? (
        <>
          <FeedbackHistoryNav
            snapshots={snapshots}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
          />

          <FocusCard focusItems={snapshot.focusItems} />

          <section className="mt-6 grid gap-6">
            {snapshot.recommendations.map((recommendation) => (
              <RecommendationCard
                key={`${snapshot._id}-${recommendation.title}`}
                recommendation={recommendation}
              />
            ))}
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
