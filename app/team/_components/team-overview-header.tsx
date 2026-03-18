"use client";

import { Users2 } from "lucide-react";

import { TeamSummary } from "./types";

export function TeamOverviewHeader({
  team,
  membersCount,
  error,
}: {
  team: TeamSummary;
  membersCount: number;
  error: string | null;
}) {
  return (
    <section className="border-b pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Active Team
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {team.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            {team.description}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-muted-foreground">
          <Users2 className="size-4" />
          {membersCount} {membersCount === 1 ? "member" : "members"}
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </section>
  );
}
