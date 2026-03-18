"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import { CallCreateForm } from "./_components/call-create-form";
import { CallsHero } from "./_components/calls-hero";
import { CallsTable } from "./_components/calls-table";
import { CallRowData } from "./_components/types";
import { uploadFile } from "./_components/utils";

export default function CallsPage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const calls = useQuery(
    api.calls.listCalls,
    workspace?.team ? {} : "skip",
  );
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

  if (!workspace) {
    return (
      <AppShell activeHref="/calls" title="Sales Calls">
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
      activeHref="/calls"
      title="Sales Calls"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
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
      <CallsHero />

      {isCreating ? (
        <CallCreateForm
          title={title}
          description={description}
          isSubmitting={isSubmitting}
          error={error}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onSellerFileChange={setSellerFile}
          onClientFileChange={setClientFile}
          onSubmit={handleCreateCall}
          onCancel={() => setIsCreating(false)}
        />
      ) : null}

      {error ? (
        <section className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-sm">
          {error}
        </section>
      ) : null}

      <CallsTable
        calls={calls as CallRowData[] | undefined}
        hasCalls={hasCalls}
        analysisCallId={analysisCallId}
        deletingCallId={deletingCallId}
        onStartAnalysis={handleStartAnalysis}
        onDeleteCall={handleDeleteCall}
      />
    </AppShell>
  );
}
