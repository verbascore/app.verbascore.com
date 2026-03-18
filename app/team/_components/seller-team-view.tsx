"use client";

import { MembersSection } from "./members-section";
import { TeamOverviewHeader } from "./team-overview-header";
import { TeamMember, TeamMembership, TeamSummary } from "./types";

export function SellerTeamView({
  team,
  membership,
  members,
  error,
  memberSearch,
  onMemberSearchChange,
  paginatedMembers,
  filteredMembersCount,
  membersPage,
  memberPageCount,
  onMembersPageChange,
}: {
  team: TeamSummary;
  membership: TeamMembership;
  members: TeamMember[];
  error: string | null;
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
  paginatedMembers: TeamMember[];
  filteredMembersCount: number;
  membersPage: number;
  memberPageCount: number;
  onMembersPageChange: (page: number) => void;
}) {
  return (
    <>
      <TeamOverviewHeader team={team} membersCount={members.length} error={error} />
      <MembersSection
        membership={membership}
        members={paginatedMembers}
        filteredMembersCount={filteredMembersCount}
        memberSearch={memberSearch}
        onMemberSearchChange={onMemberSearchChange}
        currentPage={membersPage}
        totalPages={memberPageCount}
        onPageChange={onMembersPageChange}
        canManageMembers={false}
      />
    </>
  );
}
