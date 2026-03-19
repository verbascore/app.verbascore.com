"use client";

import { PencilLine, Trash2, UserPlus, Users2 } from "lucide-react";

import { TeamCreateDialog } from "@/components/team-create-dialog";

import { DeleteTeamDialog } from "./delete-team-dialog";
import { InviteTeammateDialog } from "./invite-teammate-dialog";
import { QuickAccessButton } from "./quick-access-button";
import { TeamSettingsDialog } from "./team-settings-dialog";
import { TeamSummary } from "./types";

export function OwnerQuickAccess({
  team,
  onError,
  onDeleteTeam,
  isDeleting,
}: {
  team: TeamSummary;
  onError: (value: string | null) => void;
  onDeleteTeam: () => Promise<void>;
  isDeleting: boolean;
}) {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Quick Access</h3>
          <p className="text-sm text-muted-foreground">
            Open the most common team actions from here.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TeamSettingsDialog
          team={team}
          isOwner
          onError={onError}
          trigger={
            <QuickAccessButton
              icon={<PencilLine className="size-5" />}
              title="Team settings"
              description="Rename the team or update its description."
            />
          }
        />

        <InviteTeammateDialog
          isOwner
          onError={onError}
          trigger={
            <QuickAccessButton
              icon={<UserPlus className="size-5" />}
              title="Invite teammate"
              description="Create an invitation link for a specific email."
            />
          }
        />

        <DeleteTeamDialog
          teamTitle={team.title}
          isDeleting={isDeleting}
          onConfirm={onDeleteTeam}
          trigger={
            <QuickAccessButton
              icon={<Trash2 className="size-5" />}
              title="Delete team"
              description="Permanently remove the active workspace."
              destructive
            />
          }
        />
      </div>
    </section>
  );
}
