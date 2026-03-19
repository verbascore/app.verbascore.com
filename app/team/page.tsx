"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Link2, Mail, ShieldCheck } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamCreateDialog } from "@/components/team-create-dialog";
import { TeamEmptyState } from "@/components/team-empty-state";
import { Button } from "@/components/ui/button";

import { OwnerTeamView } from "./_components/owner-team-view";
import { SellerTeamView } from "./_components/seller-team-view";

const MEMBERS_PAGE_SIZE = 6;
const INVITATIONS_PAGE_SIZE = 6;

export default function TeamPage() {
  const router = useRouter();
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const management = useQuery(
    api.teams.getTeamManagementData,
    workspace?.team ? {} : "skip",
  );
  const revokeInvitation = useMutation(api.teams.revokeInvitation);
  const updateMemberRole = useMutation(api.teams.updateMemberRole);
  const removeMember = useMutation(api.teams.removeMember);
  const deleteTeam = useMutation(api.teams.deleteTeam);

  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [invitationSearch, setInvitationSearch] = useState("");
  const [membersPage, setMembersPage] = useState(1);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const origin =
    typeof window === "undefined" ? "" : window.location.origin.replace(/\/$/, "");

  const team = management?.team ?? workspace?.team ?? null;
  const membership = management?.membership ?? workspace?.membership ?? null;
  const members = management?.members ?? workspace?.members ?? [];
  const invitations = management?.invitations ?? [];

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();

    if (!search) {
      return members;
    }

    return members.filter((member) =>
      [member.name, member.email, member.userId, member.role]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search)),
    );
  }, [memberSearch, members]);

  const filteredInvitations = useMemo(() => {
    const search = invitationSearch.trim().toLowerCase();

    if (!search) {
      return invitations;
    }

    return invitations.filter((invitation) =>
      [invitation.email, invitation.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search)),
    );
  }, [invitationSearch, invitations]);

  const memberPageCount = Math.max(
    1,
    Math.ceil(filteredMembers.length / MEMBERS_PAGE_SIZE),
  );
  const invitationPageCount = Math.max(
    1,
    Math.ceil(filteredInvitations.length / INVITATIONS_PAGE_SIZE),
  );

  const paginatedMembers = filteredMembers.slice(
    (membersPage - 1) * MEMBERS_PAGE_SIZE,
    membersPage * MEMBERS_PAGE_SIZE,
  );
  const paginatedInvitations = filteredInvitations.slice(
    (invitationsPage - 1) * INVITATIONS_PAGE_SIZE,
    invitationsPage * INVITATIONS_PAGE_SIZE,
  );

  useEffect(() => {
    setMembersPage(1);
  }, [memberSearch]);

  useEffect(() => {
    setInvitationsPage(1);
  }, [invitationSearch]);

  useEffect(() => {
    if (membersPage > memberPageCount) {
      setMembersPage(memberPageCount);
    }
  }, [memberPageCount, membersPage]);

  useEffect(() => {
    if (invitationsPage > invitationPageCount) {
      setInvitationsPage(invitationPageCount);
    }
  }, [invitationPageCount, invitationsPage]);

  if (!workspace) {
    return (
      <AppShell activeHref="/team" title="Team">
        <section className="border-b pb-6 text-sm text-muted-foreground">
          Loading workspace...
        </section>
      </AppShell>
    );
  }

  if (!workspace.team || !workspace.membership || !team || !membership) {
    return <TeamEmptyState />;
  }

  async function handleCopyInvitation(token: string) {
    if (!origin) {
      return;
    }

    await navigator.clipboard.writeText(`${origin}/invitations/${token}`);
    setCopiedToken(token);
    window.setTimeout(() => setCopiedToken(null), 1500);
  }

  async function handleRevoke(invitationId: string, email: string) {
    const confirmed = window.confirm(`Revoke the invitation for ${email}?`);
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await revokeInvitation({ invitationId: invitationId as never });
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Failed to revoke invitation.",
      );
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

  async function handleDeleteTeam() {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteTeam({});
      router.push("/");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete team.",
      );
      setIsDeleting(false);
    }
  }

  const sharedViewProps = {
    team,
    membership,
    members,
    error,
    onError: setError,
    memberSearch,
    onMemberSearchChange: setMemberSearch,
    paginatedMembers,
    filteredMembersCount: filteredMembers.length,
    membersPage,
    memberPageCount,
    onMembersPageChange: setMembersPage,
    onRoleChange: handleRoleChange,
    onRemoveMember: handleRemove,
  };

  return (
    <AppShell
      activeHref="/team"
      title="Team"
      workspaceTitle={team.title}
      workspaceRole={membership.role}
      headerActions={
        <TeamCreateDialog
          trigger={
            <Button size="lg" className="rounded-xl px-4">
              Create team
            </Button>
          }
        />
      }
    >
      <div className="mx-auto max-w-6xl">
        {membership.role === "owner" ? (
          <OwnerTeamView
            {...sharedViewProps}
            invitations={paginatedInvitations}
            filteredInvitationsCount={filteredInvitations.length}
            invitationSearch={invitationSearch}
            onInvitationSearchChange={setInvitationSearch}
            invitationsPage={invitationsPage}
            invitationPageCount={invitationPageCount}
            onInvitationsPageChange={setInvitationsPage}
            copiedToken={copiedToken}
            onCopyInvitation={handleCopyInvitation}
            onRevokeInvitation={handleRevoke}
            onDeleteTeam={handleDeleteTeam}
            isDeleting={isDeleting}
          />
        ) : (
          <SellerTeamView {...sharedViewProps} />
        )}
      </div>
    </AppShell>
  );
}
