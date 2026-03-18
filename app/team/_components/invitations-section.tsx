"use client";

import { Copy, Trash2 } from "lucide-react";

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
import { TeamInvitation } from "./types";

export function InvitationsSection({
  invitations,
  filteredInvitationsCount,
  invitationSearch,
  onInvitationSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  copiedToken,
  onCopyInvitation,
  onRevokeInvitation,
}: {
  invitations: TeamInvitation[];
  filteredInvitationsCount: number;
  invitationSearch: string;
  onInvitationSearchChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  copiedToken: string | null;
  onCopyInvitation: (token: string) => Promise<void>;
  onRevokeInvitation: (invitationId: string, email: string) => Promise<void>;
}) {
  return (
    <section className="py-8">
      <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Invitations</h3>
          <p className="text-sm text-muted-foreground">
            Invitation links created for this team.
          </p>
        </div>

        <SearchInput
          value={invitationSearch}
          onChange={onInvitationSearchChange}
          placeholder="Search invitations"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {filteredInvitationsCount === 0
                    ? "No invitations match this search."
                    : "No invitations on this page."}
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow key={invitation._id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell className="capitalize">{invitation.status}</TableCell>
                  <TableCell>
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCopyInvitation(invitation.token)}
                      >
                        <Copy className="size-3.5" />
                        {copiedToken === invitation.token ? "Copied" : "Copy link"}
                      </Button>
                      {invitation.status === "pending" ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            onRevokeInvitation(invitation._id, invitation.email)
                          }
                        >
                          <Trash2 className="size-3.5" />
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SectionPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemLabel={`${filteredInvitationsCount} invitation${
          filteredInvitationsCount === 1 ? "" : "s"
        }`}
      />
    </section>
  );
}
