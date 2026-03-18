"use client";

import { ReactNode, useState } from "react";

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

export function DeleteTeamDialog({
  teamTitle,
  isDeleting,
  onConfirm,
  trigger,
}: {
  teamTitle: string;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    await onConfirm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delete team</DialogTitle>
          <DialogDescription>
            Deleting {teamTitle} will permanently remove calls, analyses,
            feedback, notifications, invitations, and memberships for this
            workspace.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded-xl px-4"
          >
            {isDeleting ? "Deleting..." : "Delete team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
