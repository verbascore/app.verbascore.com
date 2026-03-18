"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Copy, RefreshCw, Users } from "lucide-react";

import { api } from "@/convex/_generated/api";

type WorkspaceCardProps = {
  title: string;
  description: string;
  inviteCode: string;
  memberCount: number;
  role: "owner" | "seller";
};

export function TeamWorkspaceCard({
  title,
  description,
  inviteCode,
  memberCount,
  role,
}: WorkspaceCardProps) {
  const regenerateInviteCode = useMutation(api.teams.regenerateInviteCode);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState(inviteCode);

  async function handleCopy() {
    await navigator.clipboard.writeText(currentInviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function handleRegenerate() {
    try {
      setIsRegenerating(true);
      const nextCode = await regenerateInviteCode({});
      setCurrentInviteCode(nextCode);
    } finally {
      setIsRegenerating(false);
    }
  }

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

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="rounded-[1.4rem] border bg-background/70 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Invite Code
          </p>
          <div className="mt-2 text-2xl font-semibold tracking-[0.28em]">
            {currentInviteCode}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Share this with teammates so they can join as sellers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-background"
        >
          <Copy className="size-4" />
          {copied ? "Copied" : "Copy code"}
        </button>

        {role === "owner" ? (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw
              className={`size-4 ${isRegenerating ? "animate-spin" : ""}`}
            />
            {isRegenerating ? "Refreshing..." : "Regenerate"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
