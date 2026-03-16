"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Progress } from "@/components/ui/progress";

import { ActivePendingAnalysis } from "./types";
import { formatDateTime } from "./utils";

export function FeedbackPendingBanner({
  activePendingAnalysis,
}: {
  activePendingAnalysis: ActivePendingAnalysis;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Loader2 className="size-4 animate-spin text-cyan-400" />
            New feedback snapshot in progress
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {activePendingAnalysis.currentStep} on{" "}
            {formatDateTime(activePendingAnalysis.updatedAt)}. We’ll keep
            showing the last generated feedback until the new snapshot is ready.
          </p>
        </div>

        <Link
          href={`/calls/${activePendingAnalysis.callId}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium"
        >
          Open active call
        </Link>
      </div>

      <div className="mt-4">
        <Progress
          value={activePendingAnalysis.progress}
          className="h-3 rounded-full bg-muted/80"
        />
      </div>
    </section>
  );
}
