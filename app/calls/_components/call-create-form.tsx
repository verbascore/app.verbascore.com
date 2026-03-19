"use client";

import { FormEvent } from "react";
import { Loader2 } from "lucide-react";

type CallCreateFormProps = {
  title: string;
  description: string;
  isSubmitting: boolean;
  error: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSellerFileChange: (file: File | null) => void;
  onClientFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function CallCreateForm({
  title,
  description,
  isSubmitting,
  error,
  onTitleChange,
  onDescriptionChange,
  onSellerFileChange,
  onClientFileChange,
  onSubmit,
  onCancel,
}: CallCreateFormProps) {
  return (
    <div>
      <form className="mt-2 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium">Title</span>
          <input
            required
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="h-11 rounded-xl border bg-background px-4 text-sm outline-none ring-0"
            placeholder="Call with Sarah Mitchell"
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
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
              onSellerFileChange(event.target.files?.[0] ?? null)
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
              onClientFileChange(event.target.files?.[0] ?? null)
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
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Create call
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
