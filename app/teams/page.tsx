"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Copy, RefreshCw, ShieldCheck, Trash2, Users2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamCreateDialog } from "@/components/team-create-dialog";
import { TeamEmptyState } from "@/components/team-empty-state";

export default function TeamsPage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const management = useQuery(
    api.teams.getTeamManagementData,
    workspace?.team ? {} : "skip",
  );
  const updateTeam = useMutation(api.teams.updateTeam);
  const updateMemberRole = useMutation(api.teams.updateMemberRole);
  const removeMember = useMutation(api.teams.removeMember);
  const regenerateInviteCode = useMutation(api.teams.regenerateInviteCode);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!workspace) {
    return (
      <AppShell activeHref="/teams" title="Teams">
        <section className="rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Loading workspace...
        </section>
      </AppShell>
    );
  }

  if (!workspace.team || !workspace.membership) {
    return (
      <AppShell activeHref="/teams" title="Teams">
        <TeamEmptyState />
      </AppShell>
    );
  }

  const team = management?.team ?? workspace.team;
  const membership = management?.membership ?? workspace.membership;
  const members = management?.members ?? workspace.members;
  const inviteCode = team.inviteCode;
  const isOwner = membership.role === "owner";

  async function handleSaveTeam() {
    try {
      setIsSaving(true);
      setError(null);
      await updateTeam({
        title: title.trim() || team.title,
        description: description.trim() || team.description,
      });
      setTitle("");
      setDescription("");
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update the team.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function handleRegenerate() {
    try {
      setIsRegenerating(true);
      setError(null);
      await regenerateInviteCode({});
    } catch (regenError) {
      setError(
        regenError instanceof Error
          ? regenError.message
          : "Failed to regenerate invite code.",
      );
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleRoleChange(
    memberId: string,
    role: "owner" | "seller",
  ) {
    try {
      setError(null);
      await updateMemberRole({ memberId: memberId as never, role });
    } catch (roleError) {
      setError(
        roleError instanceof Error
          ? roleError.message
          : "Failed to update member role.",
      );
    }
  }

  async function handleRemove(memberId: string, label: string) {
    const confirmed = window.confirm(`Remove ${label} from this team?`);

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await removeMember({ memberId: memberId as never });
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Failed to remove member.",
      );
    }
  }

  return (
    <AppShell
      activeHref="/teams"
      title="Teams"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
      headerActions={
        <TeamCreateDialog
          trigger={
            <button className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Create team
            </button>
          }
        />
      }
    >
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="rounded-[2rem] border bg-card/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Active Team
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {team.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {team.description}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-muted-foreground">
              <Users2 className="size-4" />
              {members.length} {members.length === 1 ? "member" : "members"}
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <section className="rounded-[2rem] border bg-card/90 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Team settings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Owners can update the team workspace metadata.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  value={title}
                  disabled={!isOwner}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={team.title}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  disabled={!isOwner}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={team.description}
                  rows={4}
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="button"
                disabled={!isOwner || isSaving}
                onClick={handleSaveTeam}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border bg-card/90 p-6 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight">
              Add teammates
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Share the invite code so other users can join this team.
            </p>

            <div className="mt-6 rounded-[1.5rem] border bg-background/70 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Invite code
              </p>
              <div className="mt-2 text-2xl font-semibold tracking-[0.28em]">
                {inviteCode}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-background"
                >
                  <Copy className="size-4" />
                  {copied ? "Copied" : "Copy code"}
                </button>

                {isOwner ? (
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <RefreshCw
                      className={`size-4 ${
                        isRegenerating ? "animate-spin" : ""
                      }`}
                    />
                    {isRegenerating ? "Refreshing..." : "Regenerate"}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border bg-card/90 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Members</h3>
              <p className="text-sm text-muted-foreground">
                Everyone in the active team workspace.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {members.map((member) => {
              const label = member.name ?? member.email ?? member.userId;
              const isCurrentUser = member.userId === membership.userId;

              return (
                <article
                  key={member._id}
                  className="flex flex-col gap-4 rounded-[1.5rem] border bg-background/70 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email || member.userId}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {isCurrentUser ? "You" : "Member"}
                    </span>

                    <select
                      value={member.role}
                      disabled={!isOwner}
                      onChange={(event) =>
                        handleRoleChange(
                          member._id,
                          event.target.value as "owner" | "seller",
                        )
                      }
                      className="h-10 rounded-xl border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="owner">Owner</option>
                      <option value="seller">Seller</option>
                    </select>

                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => handleRemove(member._id, label)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
