"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

type WorkspaceCardProps = {
  title: string;
  description: string;
  memberCount: number;
  role: "owner" | "seller";
};

export function TeamWorkspaceCard({
  title,
  description,
  memberCount,
  role,
}: WorkspaceCardProps) {
  return (
    <section className="rounded-[2rem] border bg-card/85 p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Team Workspace
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {role}
        </span>
        <Link
          href="/team"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-background"
        >
          Manage team
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
