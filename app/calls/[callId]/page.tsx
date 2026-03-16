"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Clock3,
  Loader2,
  PlayCircle,
  Sparkles,
  Trash2,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function formatClockDuration(totalMs: number) {
  const totalSeconds = Math.max(0, Math.round(totalMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatTimestamp(totalMs: number) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getTranscriptDuration(
  transcriptEntries: Array<{
    startTimestampMs: number;
    endTimestampMs?: number;
  }>,
) {
  if (transcriptEntries.length === 0) {
    return null;
  }

  const maxTimestamp = transcriptEntries.reduce((latest, entry) => {
    return Math.max(
      latest,
      entry.endTimestampMs ?? entry.startTimestampMs,
      entry.startTimestampMs,
    );
  }, 0);

  return maxTimestamp;
}

function getSpeakerLabel(channel: "seller" | "client") {
  return channel === "seller" ? "Sales Rep" : "Customer";
}

function getSpeakerInitials(channel: "seller" | "client") {
  return channel === "seller" ? "SR" : "CU";
}

function ScoreRing({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-emerald-500/20 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.18),_transparent_52%),linear-gradient(180deg,rgba(132,204,22,0.10),rgba(132,204,22,0.03))] px-8 py-10">
      <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
      <div className="flex h-32 w-32 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10 text-5xl font-semibold tracking-tight text-lime-400 shadow-[inset_0_0_40px_rgba(132,204,22,0.12)]">
        {value}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-4">
      <p className="text-base font-medium tracking-tight">{label}</p>
      <div className="rounded-full bg-muted/70 p-1">
        <Progress value={value} className="h-3 rounded-full bg-muted/80" />
      </div>
      <p className="w-11 text-right text-xl font-semibold tracking-tight text-lime-400">
        {value}
      </p>
    </div>
  );
}

function DashboardSkeleton({
  title,
  description,
  isQueued,
  progress,
  currentStep,
}: {
  title: string;
  description?: string;
  isQueued: boolean;
  progress?: number;
  currentStep?: string;
}) {
  return (
    <>
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
        <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)] self-start">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold tracking-tight">
                Transcript
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Transcript entries will appear here once analysis finishes.
              </p>
            </div>
            <Badge variant="outline">
              {isQueued ? "Queued" : `${progress ?? 0}% complete`}
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={cn(
                  "rounded-[1.6rem] border p-5",
                  item === 2
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-white/5 bg-background/40",
                )}
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-[88%]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)] self-start">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Analysis status
              </p>
              <p className="text-2xl font-semibold tracking-tight">{title}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                {description ||
                  "We are still transcribing and scoring the conversation."}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{currentStep || "Preparing analysis"}</span>
                  <span>{progress ?? 0}%</span>
                </div>
                <Progress
                  value={progress ?? 6}
                  className="h-3 rounded-full bg-muted/80"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <Skeleton className="mx-auto h-5 w-28" />
            <div className="mt-6 flex justify-center">
              <Skeleton className="size-32 rounded-full" />
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <Skeleton className="h-8 w-36" />
            <div className="mt-5 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-[86%]" />
              <Skeleton className="h-4 w-[90%]" />
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <Skeleton className="h-8 w-44" />
            <div className="mt-6 space-y-5">
              {[0, 1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="grid grid-cols-[140px_1fr_40px] items-center gap-4"
                >
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-3 w-full rounded-full" />
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
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
  );
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
    return (
      <AppShell activeHref="/calls" title="Call Details">
        <section className="rounded-[2rem] border bg-card/90 p-8 shadow-sm">
          <p className="text-sm text-muted-foreground">Invalid call id.</p>
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

  if (!call) {
    if (call === null) {
      return (
        <AppShell activeHref="/calls" title="Call Details">
          <section className="rounded-[2rem] border bg-card/90 p-8 shadow-sm">
            <p className="text-sm text-muted-foreground">Call not found.</p>
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
                {call.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="size-4" />
                  {formatDateTime(call.createdAt)}
                </span>
                <span>
                  Duration:{" "}
                  {transcriptDuration
                    ? formatClockDuration(transcriptDuration)
                    : "Pending"}
                </span>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                {call.description || "No description provided for this call."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={!canStartAnalysis || isStartingAnalysis}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStartingAnalysis ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {call.pendingAnalysis?.status === "failed"
                  ? "Retry analysis"
                  : "Start analysis"}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteCall(call.title)}
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

          {error ? (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/8 bg-background/30 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Seller channel</p>
                {call.sellerAudioUrl ? (
                  <PlayCircle className="size-4 text-muted-foreground" />
                ) : null}
              </div>
              {call.sellerAudioUrl ? (
                <audio
                  className="mt-3 w-full"
                  controls
                  src={call.sellerAudioUrl}
                />
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Audio unavailable.
                </p>
              )}
            </div>

            <div className="rounded-[1.6rem] border border-white/8 bg-background/30 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Client channel</p>
                {call.clientAudioUrl ? (
                  <PlayCircle className="size-4 text-muted-foreground" />
                ) : null}
              </div>
              {call.clientAudioUrl ? (
                <audio
                  className="mt-3 w-full"
                  controls
                  src={call.clientAudioUrl}
                />
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Audio unavailable.
                </p>
              )}
            </div>
          </div>

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
              <section className="min-h-[20rem] max-h-[54rem] self-start overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)] self-start">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight">
                      Transcript
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Every scored transcript snippet, ordered chronologically.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {call.transcriptEntries.length} entries
                  </Badge>
                </div>

                {call.transcriptEntries.length === 0 ? (
                  <ScrollArea className="mt-6 pr-4">
                    <div className="flex items-start justify-center rounded-[1.6rem] border border-dashed border-white/10 bg-background/30 px-6 py-10 text-center self-start">
                      <div className="max-w-md self-start">
                        <p className="text-lg font-medium tracking-tight">
                          No transcript entries available
                        </p>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                          Analysis finished, but no transcript lines were saved
                          for this call. Try rerunning analysis if you expected
                          the conversation to appear here.
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="mt-6 max-h-[calc(54rem-8rem)] pr-4">
                    <div className="space-y-4">
                      {call.transcriptEntries.map((entry, index) => (
                        <article
                          key={`${entry.channel}-${entry.startTimestampMs}-${index}`}
                          className={cn(
                            "rounded-[1.6rem] border p-5 transition-colors",
                            entry.isObjection
                              ? "border-amber-500/30 bg-amber-500/8"
                              : entry.channel === "seller"
                                ? "border-cyan-400/10 bg-cyan-400/6"
                                : "border-white/6 bg-background/45",
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                                entry.channel === "seller"
                                  ? "bg-cyan-400/14 text-cyan-300"
                                  : "bg-muted text-foreground",
                              )}
                            >
                              {getSpeakerInitials(entry.channel)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="text-2xl font-medium tracking-tight">
                                  {getSpeakerLabel(entry.channel)}
                                </p>
                                {entry.isObjection ? (
                                  <Badge className="border-amber-500/40 bg-amber-500/12 text-amber-300">
                                    Objection
                                  </Badge>
                                ) : null}
                                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                  {formatTimestamp(entry.startTimestampMs)}
                                </span>
                              </div>
                              <p className="mt-3 text-[1.05rem] leading-8 text-foreground/95">
                                {entry.text}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </section>

              <div className="h-full space-y-6">
                <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                  <ScoreRing value={call.analysis.overallRating} />
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                  <p className="text-2xl font-semibold tracking-tight">
                    AI Summary
                  </p>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {call.analysis.aiSummary}
                  </p>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                  <p className="text-2xl font-semibold tracking-tight">
                    Criteria Breakdown
                  </p>
                  <div className="mt-6 space-y-5">
                    <MetricRow
                      label="Quickness"
                      value={call.analysis.quickness}
                    />
                    <MetricRow
                      label="Introduction"
                      value={call.analysis.introduction}
                    />
                    <MetricRow
                      label="Knowledge"
                      value={call.analysis.knowledge}
                    />
                    <MetricRow
                      label="Hospitality"
                      value={call.analysis.hospitality}
                    />
                    <MetricRow
                      label="Call to Action"
                      value={call.analysis.callToAction}
                    />
                  </div>
                </section>
              </div>
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
