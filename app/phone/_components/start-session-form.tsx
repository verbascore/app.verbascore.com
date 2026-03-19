"use client";

import type { FormEvent } from "react";

export function StartSessionForm({
  title,
  description,
  clientPhoneNumber,
  callMode,
  onCallModeChange,
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
  callMode: "call_my_phone" | "call_in_app";
  onCallModeChange: (value: "call_my_phone" | "call_in_app") => void;
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
      <div className="rounded-2xl border bg-background/60 p-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onCallModeChange("call_my_phone")}
            className={`rounded-xl px-4 py-3 text-left text-sm transition ${
              callMode === "call_my_phone"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-foreground hover:bg-accent"
            }`}
          >
            <p className="font-medium">Call My Phone</p>
            <p className="mt-1 text-xs opacity-80">
              Twilio rings your real phone first, then bridges the client.
            </p>
          </button>
          <button
            type="button"
            onClick={() => onCallModeChange("call_in_app")}
            className={`rounded-xl px-4 py-3 text-left text-sm transition ${
              callMode === "call_in_app"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-foreground hover:bg-accent"
            }`}
          >
            <p className="font-medium">Call In App</p>
            <p className="mt-1 text-xs opacity-80">
              Use the business line directly from VerbaScore.
            </p>
          </button>
        </div>
      </div>

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
      {!sellerPhoneNumber && callMode === "call_my_phone" ? (
        <p className="text-sm text-amber-600">
          Calling becomes available once your team owner assigns your seller
          number.
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
          (callMode === "call_my_phone" && !sellerPhoneNumber)
        }
        className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Starting..." : "Start session"}
      </button>
    </form>
  );
}
