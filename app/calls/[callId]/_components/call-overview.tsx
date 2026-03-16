"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, Loader2, Sparkles, Trash2 } from "lucide-react";

type CallOverviewProps = {
  title: string;
  description?: string;
  createdAtLabel: string;
  durationLabel: string;
  isStartingAnalysis: boolean;
  isDeleting: boolean;
  pendingStatus: boolean;
  canStartAnalysis: boolean;
  isRetry: boolean;
  onStartAnalysis: () => void;
  onDeleteCall: () => void;
};

export function CallOverview({
  title,
  description,
  createdAtLabel,
  durationLabel,
  isStartingAnalysis,
  isDeleting,
  pendingStatus,
  canStartAnalysis,
  isRetry,
  onStartAnalysis,
  onDeleteCall,
}: CallOverviewProps) {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <Link
          href="/calls"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Calls
        </Link>
        <h2 className="mt-5 text-4xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="size-4" />
            {createdAtLabel}
          </span>
          <span>Duration: {durationLabel}</span>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          {description || "No description provided for this call."}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 xl:justify-end">
        <button
          type="button"
          onClick={onStartAnalysis}
          disabled={!canStartAnalysis || isStartingAnalysis}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isStartingAnalysis ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isRetry ? "Retry analysis" : "Start analysis"}
        </button>

        <button
          type="button"
          onClick={onDeleteCall}
          disabled={isDeleting || pendingStatus}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 px-5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Delete call
        </button>
      </div>
    </div>
  );
}
