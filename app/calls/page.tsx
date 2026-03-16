"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function getCallStatus(call: {
  analysis: { overallRating: number } | null;
  pendingAnalysis: {
    status: "queued" | "processing" | "completed" | "failed";
  } | null;
}) {
  if (call.analysis) {
    return {
      label: "Analyzed",
      variant: "default" as const,
    };
  }

  if (call.pendingAnalysis?.status === "failed") {
    return {
      label: "Failed",
      variant: "destructive" as const,
    };
  }

  if (
    call.pendingAnalysis?.status === "queued" ||
    call.pendingAnalysis?.status === "processing"
  ) {
    return {
      label: "Processing",
      variant: "secondary" as const,
    };
  }

  return {
    label: "Ready",
    variant: "outline" as const,
  };
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
          Upload dual-channel MP3s, trigger AI analysis, and review each call in
          its own dashboard.
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Sales call library
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Use the table below to open any call, monitor processing, rerun
          analysis when needed, or remove records you no longer want to keep.
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
                placeholder="Call with Sarah Mitchell"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-medium">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-28 rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-0"
                placeholder="Account context, stakeholder notes, pain points, and expectations."
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
              <p className="text-sm text-destructive md:col-span-2">{error}</p>
            ) : null}

            <div className="flex gap-3 md:col-span-2">
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

      {error ? (
        <section className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-sm">
          {error}
        </section>
      ) : null}

      <section className="mt-6 rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Library
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">
              All recorded calls
            </h3>
          </div>
          {calls ? (
            <p className="text-sm text-muted-foreground">
              {calls.length} {calls.length === 1 ? "call" : "calls"}
            </p>
          ) : null}
        </div>

        {!calls ? (
          <div className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading calls...
          </div>
        ) : !hasCalls ? (
          <div className="px-6 py-8 text-sm text-muted-foreground">
            No calls yet. Start by uploading a seller and client MP3 pair.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="pl-6">Call</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="w-[28%]">Description</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => {
                const status = getCallStatus(call);
                const isAnalysisRunning =
                  !!call.pendingAnalysis &&
                  call.pendingAnalysis.status !== "failed" &&
                  call.pendingAnalysis.status !== "completed";
                const isDeleting = deletingCallId === call._id;
                const canStartAnalysis =
                  !call.analysis &&
                  (!call.pendingAnalysis ||
                    call.pendingAnalysis.status === "failed");

                return (
                  <TableRow key={call._id} className="hover:bg-muted/30">
                    <TableCell className="pl-6 align-top">
                      <div className="grid gap-1">
                        <Link
                          href={`/calls/${call._id}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight hover:text-primary"
                        >
                          {call.title}
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {call._id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatDateTime(call.createdAt)}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="align-top text-sm font-medium">
                      {call.analysis
                        ? `${call.analysis.overallRating}/100`
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-0 align-top whitespace-normal text-sm text-muted-foreground">
                      {call.description || "No description provided."}
                    </TableCell>
                    <TableCell className="pr-6 align-top">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/calls/${call._id}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleStartAnalysis(call._id)}
                          disabled={
                            !canStartAnalysis || analysisCallId === call._id
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {analysisCallId === call._id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Sparkles className="size-4" />
                          )}
                          Analyze
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCall(call._id, call.title)}
                          disabled={isDeleting || isAnalysisRunning}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
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
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </AppShell>
  );
}
