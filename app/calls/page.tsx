"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import { OwnerCallsView } from "./_components/owner-calls-view";
import { SellerCallsView } from "./_components/seller-calls-view";
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
  const [selectedSeller, setSelectedSeller] = useState("average");

  const sellerOptions = useMemo(
    () =>
      workspace?.members
        ?.filter((member) => member.role === "seller")
        .map((member) => ({
          userId: member.userId,
          name: member.name ?? member.email ?? member.userId,
          email: member.email ?? undefined,
        })) ?? [],
    [workspace?.members],
  );
  const isOwner = workspace?.membership?.role === "owner";
  const visibleCalls = useMemo(() => {
    if (!calls || !workspace?.membership) {
      return calls;
    }

    if (workspace.membership.role === "owner") {
      const sellerIds = sellerOptions.map((seller) => seller.userId);
      const sellerCalls = calls.filter((call) =>
        sellerIds.includes(call.ownerUserId),
      );

      return selectedSeller === "average"
        ? sellerCalls
        : sellerCalls.filter((call) => call.ownerUserId === selectedSeller);
    }

    return calls.filter((call) => call.ownerUserId === workspace.membership.userId);
  }, [calls, selectedSeller, sellerOptions, workspace?.membership]);
  const hasCalls = useMemo(() => (visibleCalls ?? []).length > 0, [visibleCalls]);

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
      headerActions={!isOwner ? (
        <button
          onClick={() => setIsCreating((value) => !value)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Start new call
        </button>
      ) : undefined}
    >
      {isOwner ? (
        <OwnerCallsView
          selectedSeller={selectedSeller}
          onSelectedSellerChange={setSelectedSeller}
          sellerOptions={sellerOptions}
          error={error}
          calls={visibleCalls as CallRowData[] | undefined}
          hasCalls={hasCalls}
          analysisCallId={analysisCallId}
          deletingCallId={deletingCallId}
          onStartAnalysis={handleStartAnalysis}
          onDeleteCall={handleDeleteCall}
        />
      ) : (
        <SellerCallsView
          isCreating={isCreating}
          isSubmitting={isSubmitting}
          error={error}
          title={title}
          description={description}
          calls={visibleCalls as CallRowData[] | undefined}
          hasCalls={hasCalls}
          analysisCallId={analysisCallId}
          deletingCallId={deletingCallId}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onSellerFileChange={setSellerFile}
          onClientFileChange={setClientFile}
          onSubmit={handleCreateCall}
          onCancel={() => setIsCreating(false)}
          onStartAnalysis={handleStartAnalysis}
          onDeleteCall={handleDeleteCall}
        />
      )}
    </AppShell>
  );
}
