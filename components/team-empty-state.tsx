"use client";

import { FormEvent, ReactNode, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
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
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(34,197,246,0.14),_transparent_24%),linear-gradient(180deg,_transparent,_rgba(15,23,42,0.03))]">
      <header className="border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-black/5 dark:ring-white/10">
              <Image
                src="/verbascore-mark.png"
                alt="Verbascore"
                width={44}
                height={44}
                className="h-8 w-8 object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Verbascore</p>
              <p className="text-xs text-muted-foreground">
                Team workspace onboarding
              </p>
            </div>
          </Link>

          <UserButton />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-1 items-center px-4 py-10 md:px-6 md:py-14">
        <div className="grid w-full gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Team Workspace Required
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              Create your team before uploading shared calls
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              Calls, analyses, feedback snapshots, and notifications now live
              inside a shared team workspace. Every record still keeps the
              creator reference, while team owners can manage users,
              invitations, and team data.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
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
          </section>

          <section className="rounded-[2rem] border bg-background/85 p-7 shadow-sm backdrop-blur">
            <h2 className="text-xl font-semibold tracking-tight">
              Create a team
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You’ll be added as the owner automatically.
            </p>

            <form onSubmit={handleSubmit} className="mt-7">
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

            <div className="my-7 border-t" />

            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Joining a team
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ask a team owner to send you an invitation link, then open it
                while signed in to join their workspace.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
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
