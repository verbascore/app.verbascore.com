"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function QuickCaptureForm({
  values,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}: {
  values: {
    fullName: string;
    phoneNumber: string;
    email: string;
    organizationName: string;
    jobTitle: string;
    notes: string;
  };
  onChange: (field: string, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const created = await onSubmit(event);

    if (created) {
      setOpen(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-card/90 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Quick capture
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">
        Add clients through a focused dialog
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Keep the CRM surface compact and open a dedicated dialog when you need to
        add a new client record.
      </p>

      <div className="mt-5 rounded-2xl border bg-background/70 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">New client</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture the phone number first, then save richer context like company,
              email, and notes.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                <Plus className="size-4" />
                Add client
              </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add client</DialogTitle>
                <DialogDescription>
                  Create a team-scoped CRM record with a normalized phone number so
                  sales can reuse the same client book across web and mobile.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Full name</label>
                    <input
                      value={values.fullName}
                      onChange={(event) => onChange("fullName", event.target.value)}
                      placeholder="Jane Doe"
                      className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone number</label>
                    <input
                      value={values.phoneNumber}
                      onChange={(event) => onChange("phoneNumber", event.target.value)}
                      placeholder="+1 555 555 5555"
                      className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                      value={values.email}
                      onChange={(event) => onChange("email", event.target.value)}
                      placeholder="jane@company.com"
                      className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Organization</label>
                    <input
                      value={values.organizationName}
                      onChange={(event) =>
                        onChange("organizationName", event.target.value)
                      }
                      placeholder="Acme Inc."
                      className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Job title</label>
                    <input
                      value={values.jobTitle}
                      onChange={(event) => onChange("jobTitle", event.target.value)}
                      placeholder="VP Sales"
                      className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Notes</label>
                    <textarea
                      value={values.notes}
                      onChange={(event) => onChange("notes", event.target.value)}
                      placeholder="Relationship context, objections, or next steps."
                      className="mt-2 min-h-28 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !values.fullName.trim() ||
                    !values.phoneNumber.trim()
                  }
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save client"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
