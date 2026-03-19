"use client";

import { FormEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CallCreateForm } from "./call-create-form";

export function CallCreateDialog({
  open,
  onOpenChange,
  isSubmitting,
  error,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSellerFileChange,
  onClientFileChange,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  error: string | null;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSellerFileChange: (file: File | null) => void;
  onClientFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create a call record</DialogTitle>
          <DialogDescription>
            Upload both call channels and add context for the analysis workflow.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
