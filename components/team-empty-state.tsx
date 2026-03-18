"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useMutation } from "convex/react";
import { Building2, ShieldCheck, Users } from "lucide-react";

import { api } from "@/convex/_generated/api";

export function TeamEmptyState() {
  const createTeam = useMutation(api.teams.createTeam);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Add a team title to continue.");
      return;
    }

    if (!description.trim()) {
      setError("Add a short description so your team workspace has context.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createTeam({
        title: title.trim(),
        description: description.trim(),
      });
      setTitle("");
      setDescription("");
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
    <section className="mx-auto w-full max-w-5xl rounded-[2rem] border bg-card/90 p-8 shadow-sm">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div>
          <div className="inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Team Workspace Required
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Create your team before uploading shared calls
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Calls, analyses, feedback snapshots, and notifications now belong to
            a shared team workspace. Every record still keeps the creator
            reference, while team owners can manage users, invitations, and all
            team data.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<Users className="size-5" />}
              title="Shared pipeline"
              description="Every seller on the team can review the same calls, analytics, and coaching output."
            />
            <FeatureCard
              icon={<ShieldCheck className="size-5" />}
              title="Owner controls"
              description="Owners can manage team members and any entity created inside the workspace."
            />
            <FeatureCard
              icon={<Building2 className="size-5" />}
              title="Clear context"
              description="Each team has its own title and description so the workspace is easy to identify."
            />
          </div>
        </div>

        <div className="rounded-[1.75rem] border bg-background/80 p-6 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight">
            Create a team
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You will be added as the team owner automatically.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="block text-sm font-medium">Team title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enterprise Sales"
              className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none ring-0 transition-colors focus:border-primary"
            />

            <label className="mt-5 block text-sm font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Shared workspace for reviewing calls, analytics, and coaching feedback."
              rows={5}
              className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-0 transition-colors focus:border-primary"
            />

            {error ? (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating team..." : "Create team workspace"}
            </button>
          </form>

          <div className="my-6 border-t" />

          <h3 className="text-lg font-semibold tracking-tight">
            Joining a team
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask a team owner to send you an invitation link, then open it while
            signed in to join their workspace.
          </p>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.5rem] border bg-background/70 p-5">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}
