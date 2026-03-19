"use client";

import { InvitationsSection } from "./invitations-section";
import { MembersSection } from "./members-section";
import { OwnerQuickAccess } from "./owner-quick-access";
import { TeamOverviewHeader } from "./team-overview-header";
import {
  TeamInvitation,
  TeamMember,
  TeamMembership,
  TeamSummary,
} from "./types";

export function OwnerTeamView({
  team,
  membership,
  members,
  error,
  onError,
  memberSearch,
  onMemberSearchChange,
  paginatedMembers,
  filteredMembersCount,
  membersPage,
  memberPageCount,
  onMembersPageChange,
  onRoleChange,
  onPhoneNumberChange,
  onRemoveMember,
  invitations,
  filteredInvitationsCount,
  invitationSearch,
  onInvitationSearchChange,
  invitationsPage,
  invitationPageCount,
  onInvitationsPageChange,
  copiedToken,
  onCopyInvitation,
  onRevokeInvitation,
  onDeleteTeam,
  isDeleting,
}: {
  team: TeamSummary;
  membership: TeamMembership;
  members: TeamMember[];
  error: string | null;
  onError: (value: string | null) => void;
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
  paginatedMembers: TeamMember[];
  filteredMembersCount: number;
  membersPage: number;
  memberPageCount: number;
  onMembersPageChange: (page: number) => void;
  onRoleChange: (memberId: string, role: "owner" | "seller") => Promise<void>;
  onPhoneNumberChange: (memberId: string, phoneNumber: string) => Promise<void>;
  onRemoveMember: (memberId: string, label: string) => Promise<void>;
  invitations: TeamInvitation[];
  filteredInvitationsCount: number;
  invitationSearch: string;
  onInvitationSearchChange: (value: string) => void;
  invitationsPage: number;
  invitationPageCount: number;
  onInvitationsPageChange: (page: number) => void;
  copiedToken: string | null;
  onCopyInvitation: (token: string) => Promise<void>;
  onRevokeInvitation: (invitationId: string, email: string) => Promise<void>;
  onDeleteTeam: () => Promise<void>;
  isDeleting: boolean;
}) {
  return (
    <>
      <TeamOverviewHeader team={team} membersCount={members.length} error={error} />
      <OwnerQuickAccess
        team={team}
        onError={onError}
        onDeleteTeam={onDeleteTeam}
        isDeleting={isDeleting}
      />
      <InvitationsSection
        invitations={invitations}
        filteredInvitationsCount={filteredInvitationsCount}
        invitationSearch={invitationSearch}
        onInvitationSearchChange={onInvitationSearchChange}
        currentPage={invitationsPage}
        totalPages={invitationPageCount}
        onPageChange={onInvitationsPageChange}
        copiedToken={copiedToken}
        onCopyInvitation={onCopyInvitation}
        onRevokeInvitation={onRevokeInvitation}
      />
      <MembersSection
        membership={membership}
        members={paginatedMembers}
        filteredMembersCount={filteredMembersCount}
        memberSearch={memberSearch}
        onMemberSearchChange={onMemberSearchChange}
        currentPage={membersPage}
        totalPages={memberPageCount}
        onPageChange={onMembersPageChange}
        canManageMembers
        onRoleChange={onRoleChange}
        onPhoneNumberChange={onPhoneNumberChange}
        onRemoveMember={onRemoveMember}
      />
    </>
  );
}
