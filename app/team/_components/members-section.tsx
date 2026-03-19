"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SearchInput } from "./search-input";
import { SectionPagination } from "./section-pagination";
import { TeamMember, TeamMembership } from "./types";

export function MembersSection({
  membership,
  members,
  filteredMembersCount,
  memberSearch,
  onMemberSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  canManageMembers,
  onRoleChange,
  onPhoneNumberChange,
  onRemoveMember,
}: {
  membership: TeamMembership;
  members: TeamMember[];
  filteredMembersCount: number;
  memberSearch: string;
  onMemberSearchChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canManageMembers: boolean;
  onRoleChange?: (memberId: string, role: "owner" | "seller") => Promise<void>;
  onPhoneNumberChange?: (memberId: string, phoneNumber: string) => Promise<void>;
  onRemoveMember?: (memberId: string, label: string) => Promise<void>;
}) {
  const [phoneDrafts, setPhoneDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setPhoneDrafts(
      Object.fromEntries(
        members.map((member) => [member._id, member.phoneNumber ?? ""]),
      ),
    );
  }, [members]);

  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Members</h3>
          <p className="text-sm text-muted-foreground">
            Everyone currently in this team workspace.
          </p>
        </div>

        <SearchInput
          value={memberSearch}
          onChange={onMemberSearchChange}
          placeholder="Search members"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email / User</TableHead>
              <TableHead>Seller phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {filteredMembersCount === 0
                    ? "No members match this search."
                    : "No members on this page."}
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
                const label = member.name ?? member.email ?? member.userId;
                const isCurrentUser = member.userId === membership.userId;
                const isProtectedOwner = isCurrentUser && member.role === "owner";
                const canEditRole = canManageMembers && !isProtectedOwner;
                const canRemoveMember = canManageMembers && !isProtectedOwner;

                return (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {member.email || member.userId}
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      {canManageMembers && member.role === "seller" ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={phoneDrafts[member._id] ?? ""}
                            onChange={(event) =>
                              setPhoneDrafts((current) => ({
                                ...current,
                                [member._id]: event.target.value,
                              }))
                            }
                            placeholder="Assign phone number"
                            className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onPhoneNumberChange?.(
                                member._id,
                                (phoneDrafts[member._id] ?? "").trim(),
                              )
                            }
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {member.phoneNumber || "Not assigned"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEditRole ? (
                        <select
                          value={member.role}
                          onChange={(event) =>
                            onRoleChange?.(
                              member._id,
                              event.target.value as "owner" | "seller",
                            )
                          }
                          className="h-9 rounded-lg border bg-background px-3 text-sm"
                        >
                          <option value="owner">Owner</option>
                          <option value="seller">Seller</option>
                        </select>
                      ) : (
                        <span className="capitalize">{member.role}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <span className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          {isCurrentUser ? "You" : "Member"}
                        </span>
                        {canRemoveMember ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onRemoveMember?.(member._id, label)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <SectionPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemLabel={`${filteredMembersCount} member${
          filteredMembersCount === 1 ? "" : "s"
        }`}
      />
    </section>
  );
}
