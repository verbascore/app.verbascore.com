"use client";

import type { FormEvent } from "react";

export function StartSessionForm({
  title,
  description,
  clientPhoneNumber,
  onTitleChange,
  onDescriptionChange,
  onClientPhoneNumberChange,
  onSubmit,
  isSubmitting,
  sellerPhoneNumber,
  error,
}: {
  title: string;
  description: string;
  clientPhoneNumber: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClientPhoneNumberChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  sellerPhoneNumber?: string;
  error: string | null;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Call title"
        className="h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none ring-0 transition focus:border-primary"
      />
      <textarea
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder="Call description"
        className="min-h-28 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
      />
      <input
        value={clientPhoneNumber}
        onChange={(event) => onClientPhoneNumberChange(event.target.value)}
        placeholder="Client phone number"
        className="h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none ring-0 transition focus:border-primary"
      />
      {!sellerPhoneNumber ? (
        <p className="text-sm text-amber-600">
          Save your seller phone number first from Account in the mobile app or
          team profile.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={
          isSubmitting ||
          !title.trim() ||
          !description.trim() ||
          !clientPhoneNumber.trim() ||
          !sellerPhoneNumber
        }
        className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Starting..." : "Start session"}
      </button>
    </form>
  );
}
