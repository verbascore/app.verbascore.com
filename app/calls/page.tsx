"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Loader2,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";

async function uploadFile(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  const result = (await response.json()) as { storageId: string };
  return result.storageId;
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-background/80 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default function CallsPage() {
  const calls = useQuery(api.calls.listCalls);
  const generateUploadUrl = useMutation(api.calls.generateUploadUrl);
  const createCall = useMutation(api.calls.createCall);
  const startAnalysis = useMutation(api.calls.startAnalysis);
  const deleteCall = useMutation(api.calls.deleteCall);

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisCallId, setAnalysisCallId] = useState<string | null>(null);
  const [deletingCallId, setDeletingCallId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sellerFile, setSellerFile] = useState<File | null>(null);
  const [clientFile, setClientFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCalls = useMemo(() => (calls ?? []).length > 0, [calls]);

  async function handleCreateCall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sellerFile || !clientFile) {
      setError("Please upload both MP3 files.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const [sellerUploadUrl, clientUploadUrl] = await Promise.all([
        generateUploadUrl({}),
        generateUploadUrl({}),
      ]);

      const [sellerAudioStorageId, clientAudioStorageId] = await Promise.all([
        uploadFile(sellerUploadUrl, sellerFile),
        uploadFile(clientUploadUrl, clientFile),
      ]);

      await createCall({
        sellerAudioStorageId: sellerAudioStorageId as never,
        clientAudioStorageId: clientAudioStorageId as never,
        title,
        description: description || undefined,
      });

      setTitle("");
      setDescription("");
      setSellerFile(null);
      setClientFile(null);
      setIsCreating(false);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to create the call.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartAnalysis(callId: string) {
    try {
      setAnalysisCallId(callId);
      setError(null);
      await startAnalysis({ callId: callId as never });
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Failed to start analysis.",
      );
    } finally {
      setAnalysisCallId(null);
    }
  }

  async function handleDeleteCall(callId: string, callTitle: string) {
    const confirmed = window.confirm(
      `Delete "${callTitle}"? This will permanently remove the call, audio files, and any analysis data.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCallId(callId);
      setError(null);
      await deleteCall({ callId: callId as never });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete the call.",
      );
    } finally {
      setDeletingCallId(null);
    }
  }

  return (
    <AppShell
      activeHref="/calls"
      title="Sales Calls"
      headerActions={
        <button
          onClick={() => setIsCreating((value) => !value)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Start new call
        </button>
      }
    >
      <section className="rounded-3xl border bg-card/90 p-6 shadow-sm backdrop-blur">
        <p className="text-sm text-muted-foreground">
          Upload a seller track and a client track, create the call record, then
          run AI analysis when you are ready.
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Sales call library
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Every call is stored with dual-channel audio, transcript entries,
          progress tracking, and an eventual GPT-based analysis.
        </p>
      </section>

      {isCreating ? (
        <section className="mt-6 rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                New Call
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                Create a call record
              </h3>
            </div>
          </div>

          <form
            className="mt-6 grid gap-4 md:grid-cols-2"
            onSubmit={handleCreateCall}
          >
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-medium">Title</span>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-11 rounded-xl border bg-background px-4 text-sm outline-none ring-0"
                placeholder="Q2 growth strategy call"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-medium">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-28 rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-0"
                placeholder="Context, lead source, product discussed, and any notes."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Seller MP3</span>
              <input
                required
                type="file"
                accept=".mp3,audio/mpeg"
                onChange={(event) =>
                  setSellerFile(event.target.files?.[0] ?? null)
                }
                className="block rounded-xl border bg-background px-4 py-3 text-sm"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Client MP3</span>
              <input
                required
                type="file"
                accept=".mp3,audio/mpeg"
                onChange={(event) =>
                  setClientFile(event.target.files?.[0] ?? null)
                }
                className="block rounded-xl border bg-background px-4 py-3 text-sm"
              />
            </label>

            {error ? (
              <p className="md:col-span-2 text-sm text-destructive">{error}</p>
            ) : null}

            <div className="md:col-span-2 flex gap-3">
              <button
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Create call
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4">
        {!calls ? (
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading calls...
            </div>
          </div>
        ) : !hasCalls ? (
          <div className="rounded-3xl border bg-card p-8 shadow-sm">
            <p className="text-sm text-muted-foreground">
              No calls yet. Start by uploading a seller and client MP3 pair.
            </p>
          </div>
        ) : (
          calls.map((call) => {
            const isAnalysisRunning =
              !!call.pendingAnalysis &&
              call.pendingAnalysis.status !== "failed" &&
              call.pendingAnalysis.status !== "completed";
            const isDeleting = deletingCallId === call._id;

            return (
              <article
                key={call._id}
                className="rounded-3xl border bg-card p-6 shadow-sm"
              >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Call
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                    {call.title}
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {call.description || "No description provided."}
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-3 md:items-end">
                  {call.analysis ? null : call.pendingAnalysis &&
                    call.pendingAnalysis.status !== "failed" ? (
                    <div className="min-w-56 rounded-2xl border bg-background/70 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Analysis in progress
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {call.pendingAnalysis.progress}%
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {call.pendingAnalysis.currentStep}
                      </p>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${call.pendingAnalysis.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartAnalysis(call._id)}
                      disabled={analysisCallId === call._id}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {analysisCallId === call._id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      Start analysis
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteCall(call._id, call.title)}
                    disabled={isDeleting || isAnalysisRunning}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      isAnalysisRunning
                        ? "Wait for analysis to finish before deleting this call."
                        : undefined
                    }
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

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-background/70 p-4">
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

                <div className="rounded-2xl border bg-background/70 p-4">
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
                <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-destructive">
                    Analysis failed
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {call.pendingAnalysis.errorMessage ||
                      "An unexpected error occurred."}
                  </p>
                </div>
              ) : null}

              {call.analysis ? (
                <div className="mt-6 rounded-3xl border bg-background/60 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        AI Analysis
                      </p>
                      <h4 className="mt-2 text-xl font-semibold tracking-tight">
                        Overall rating: {call.analysis.overallRating}/100
                      </h4>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {call.analysis.aiSummary}
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <ScoreBadge
                      label="Quickness"
                      value={call.analysis.quickness}
                    />
                    <ScoreBadge
                      label="Introduction"
                      value={call.analysis.introduction}
                    />
                    <ScoreBadge
                      label="Knowledge"
                      value={call.analysis.knowledge}
                    />
                    <ScoreBadge
                      label="Hospitality"
                      value={call.analysis.hospitality}
                    />
                    <ScoreBadge
                      label="Call To Action"
                      value={call.analysis.callToAction}
                    />
                    <ScoreBadge
                      label="Overall"
                      value={call.analysis.overallRating}
                    />
                  </div>
                </div>
              ) : null}
              </article>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
