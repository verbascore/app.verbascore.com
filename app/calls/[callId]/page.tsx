"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";

import { AnalysisSidebar } from "./_components/analysis-sidebar";
import { AudioPanels } from "./_components/audio-panels";
import { CallOverview } from "./_components/call-overview";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";
import { TranscriptPanel } from "./_components/transcript-panel";
import { CallDetailsData } from "./_components/types";
import {
  formatClockDuration,
  formatDateTime,
  getTranscriptDuration,
} from "./_components/utils";

function InvalidCallState({ message }: { message: string }) {
  return (
    <AppShell activeHref="/calls" title="Call Details">
      <section className="rounded-[2rem] border bg-card/90 p-8 shadow-sm">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link
          href="/calls"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium"
        >
          Back to calls
        </Link>
      </section>
    </AppShell>
  );
}

export default function CallDetailsPage() {
  const params = useParams<{ callId: string }>();
  const router = useRouter();
  const callId =
    typeof params.callId === "string" ? params.callId : params.callId?.[0];

  const call = useQuery(
    api.calls.getCallDetails,
    callId ? { callId: callId as never } : "skip",
  ) as CallDetailsData | null | undefined;
  const startAnalysis = useMutation(api.calls.startAnalysis);
  const deleteCall = useMutation(api.calls.deleteCall);

  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcriptDuration = useMemo(() => {
    if (!call?.transcriptEntries) {
      return null;
    }

    return getTranscriptDuration(call.transcriptEntries);
  }, [call?.transcriptEntries]);

  async function handleStartAnalysis() {
    if (!callId) {
      setError("Invalid call id.");
      return;
    }

    try {
      setIsStartingAnalysis(true);
      setError(null);
      await startAnalysis({ callId: callId as never });
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Failed to start analysis.",
      );
    } finally {
      setIsStartingAnalysis(false);
    }
  }

  async function handleDeleteCall(callTitle: string) {
    if (!callId) {
      setError("Invalid call id.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${callTitle}"? This will permanently remove the call, audio files, and any analysis data.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await deleteCall({ callId: callId as never });
      router.push("/calls");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete the call.",
      );
      setIsDeleting(false);
    }
  }

  if (!callId) {
    return <InvalidCallState message="Invalid call id." />;
  }

  if (!call) {
    if (call === null) {
      return <InvalidCallState message="Call not found." />;
    }

    return (
      <AppShell activeHref="/calls" title="Call Details">
        <div className="flex items-center gap-3 rounded-[2rem] border bg-card/90 p-6 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading call dashboard...
        </div>
      </AppShell>
    );
  }

  const pendingStatus =
    !!call.pendingAnalysis &&
    call.pendingAnalysis.status !== "failed" &&
    !call.analysis;

  const canStartAnalysis =
    !call.analysis &&
    (!call.pendingAnalysis || call.pendingAnalysis.status === "failed");

  return (
    <AppShell activeHref="/calls" title="Call Dashboard">
      <div className="-mx-4 -my-6 min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(71,85,105,0.2),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.2),rgba(2,6,23,0.46))] px-4 py-6 md:-mx-6 md:px-6">
        <section>
          <CallOverview
            title={call.title}
            description={call.description}
            createdAtLabel={formatDateTime(call.createdAt)}
            durationLabel={
              transcriptDuration
                ? formatClockDuration(transcriptDuration)
                : "Pending"
            }
            isStartingAnalysis={isStartingAnalysis}
            isDeleting={isDeleting}
            pendingStatus={pendingStatus}
            canStartAnalysis={canStartAnalysis}
            isRetry={call.pendingAnalysis?.status === "failed"}
            onStartAnalysis={handleStartAnalysis}
            onDeleteCall={() => handleDeleteCall(call.title)}
          />

          {error ? (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <AudioPanels
            sellerAudioUrl={call.sellerAudioUrl}
            clientAudioUrl={call.clientAudioUrl}
          />

          {call.pendingAnalysis?.status === "failed" ? (
            <div className="mt-6 rounded-[1.6rem] border border-destructive/30 bg-destructive/5 p-5">
              <p className="text-sm font-medium text-destructive">
                Analysis failed
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {call.pendingAnalysis.errorMessage ||
                  "An unexpected error occurred while processing this call."}
              </p>
            </div>
          ) : null}

          {call.analysis ? (
            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
              <TranscriptPanel transcriptEntries={call.transcriptEntries} />
              <AnalysisSidebar analysis={call.analysis} />
            </div>
          ) : (
            <DashboardSkeleton
              title={
                pendingStatus
                  ? "Analysis is still running"
                  : "Dashboard fills in after analysis starts"
              }
              description={
                pendingStatus
                  ? "We are transcribing both channels, extracting objections, and scoring the call."
                  : "Trigger analysis to generate the transcript, summary, and score breakdown for this call."
              }
              isQueued={call.pendingAnalysis?.status === "queued"}
              progress={call.pendingAnalysis?.progress}
              currentStep={call.pendingAnalysis?.currentStep}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
