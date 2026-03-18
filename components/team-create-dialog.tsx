"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TeamCreateDialog({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const createTeam = useMutation(api.teams.createTeam);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      await createTeam({
        title: title.trim(),
        description: description.trim(),
      });
      setTitle("");
      setDescription("");
      setOpen(false);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to create the team.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Team title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Mid-Market Team"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Shared workspace for calls, analytics, and coaching."
              rows={4}
              className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create team"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
