"use client";

import { ReactNode } from "react";

import { FeedbackEmptyState } from "./feedback-empty-state";
import { FeedbackHeader } from "./feedback-header";
import { FeedbackHistoryNav } from "./feedback-history-nav";
import { FeedbackPendingBanner } from "./feedback-pending-banner";
import { FocusCard } from "./focus-card";
import { RecommendationCard } from "./recommendation-card";
import { FeedbackDashboardSlice } from "./types";

export function SellerFeedbackView({
  data,
  selectedIndex,
  onSelectIndex,
  scopeControl,
}: {
  data: FeedbackDashboardSlice | null;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  scopeControl?: ReactNode;
}) {
  const snapshots = data?.snapshots ?? [];
  const snapshot = snapshots[Math.min(selectedIndex, Math.max(snapshots.length - 1, 0))];

  return (
    <>
      <FeedbackHeader scopeControl={scopeControl} />

      {data?.activePendingAnalysis ? (
        <FeedbackPendingBanner activePendingAnalysis={data.activePendingAnalysis} />
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
            onSelectIndex={onSelectIndex}
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
    </>
  );
}
