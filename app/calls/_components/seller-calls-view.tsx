"use client";

import { FormEvent } from "react";

import { CallCreateForm } from "./call-create-form";
import { CallsHero } from "./calls-hero";
import { CallsTable } from "./calls-table";
import { CallRowData } from "./types";

export function SellerCallsView({
  isCreating,
  isSubmitting,
  error,
  title,
  description,
  calls,
  hasCalls,
  analysisCallId,
  deletingCallId,
  onTitleChange,
  onDescriptionChange,
  onSellerFileChange,
  onClientFileChange,
  onSubmit,
  onCancel,
  onStartAnalysis,
  onDeleteCall,
}: {
  isCreating: boolean;
  isSubmitting: boolean;
  error: string | null;
  title: string;
  description: string;
  calls: CallRowData[] | undefined;
  hasCalls: boolean;
  analysisCallId: string | null;
  deletingCallId: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSellerFileChange: (file: File | null) => void;
  onClientFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onStartAnalysis: (callId: string) => void;
  onDeleteCall: (callId: string, callTitle: string) => void;
}) {
  return (
    <>
      <CallsHero />

      {isCreating ? (
        <CallCreateForm
          title={title}
          description={description}
          isSubmitting={isSubmitting}
          error={error}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onSellerFileChange={onSellerFileChange}
          onClientFileChange={onClientFileChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      ) : null}

      {error ? (
        <section className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-sm">
          {error}
        </section>
      ) : null}

      <CallsTable
        calls={calls}
        hasCalls={hasCalls}
        analysisCallId={analysisCallId}
        deletingCallId={deletingCallId}
        onStartAnalysis={onStartAnalysis}
        onDeleteCall={onDeleteCall}
      />
    </>
  );
}
