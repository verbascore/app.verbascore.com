"use client";

import { ReactNode, useEffect, useState } from "react";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { TeamSummary } from "./types";

export function TeamSettingsDialog({
  team,
  isOwner,
  onError,
  trigger,
}: {
  team: TeamSummary;
  isOwner: boolean;
  onError: (value: string | null) => void;
  trigger: ReactNode;
}) {
  const updateTeam = useMutation(api.teams.updateTeam);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(team.title);
  const [description, setDescription] = useState(team.description);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(team.title);
      setDescription(team.description);
    }
  }, [open, team.description, team.title]);

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      onError(null);
      await updateTeam({
        title: title.trim(),
        description: description.trim(),
      });
      setOpen(false);
    } catch (submissionError) {
      onError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to update the team.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Team settings</DialogTitle>
          <DialogDescription>
            Update the team title and description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              disabled={!isOwner}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 h-11 rounded-xl px-4 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              disabled={!isOwner}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={!isOwner || isSubmitting}
            className="rounded-xl px-4"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
