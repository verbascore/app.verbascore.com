"use client";

import { ReactNode, useState } from "react";
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

export function InviteTeammateDialog({
  isOwner,
  onError,
  trigger,
}: {
  isOwner: boolean;
  onError: (value: string | null) => void;
  trigger: ReactNode;
}) {
  const createInvitation = useMutation(api.teams.createInvitation);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      onError(null);
      await createInvitation({ email: email.trim() });
      setEmail("");
      setOpen(false);
    } catch (submissionError) {
      onError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to create invitation.",
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
          <DialogTitle>Invite teammate</DialogTitle>
          <DialogDescription>
            Create an invitation link tied to a specific email address.
          </DialogDescription>
        </DialogHeader>

        <div>
          <label className="text-sm font-medium">Invitee email</label>
          <Input
            value={email}
            disabled={!isOwner}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seller@company.com"
            className="mt-2 h-11 rounded-xl px-4 text-sm"
          />
        </div>

        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={!isOwner || isSubmitting}
            className="rounded-xl px-4"
          >
            {isSubmitting ? "Creating..." : "Create invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
