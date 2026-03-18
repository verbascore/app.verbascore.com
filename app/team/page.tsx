"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  Copy,
  Link2,
  Mail,
  PencilLine,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users2,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamCreateDialog } from "@/components/team-create-dialog";
import { TeamEmptyState } from "@/components/team-empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const isOwner = membership?.role === "owner";

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
              {members.length} {members.length === 1 ? "member" : "members"}
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </section>

        {isOwner ? (
          <section className="py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Quick Access
                </h3>
                <p className="text-sm text-muted-foreground">
                  Open the most common team actions from here.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <TeamSettingsDialog
                team={team}
                isOwner={isOwner}
                onError={setError}
                trigger={
                  <QuickAccessButton
                    icon={<PencilLine className="size-5" />}
                    title="Team settings"
                    description="Rename the team or update its description."
                  />
                }
              />

              <InviteTeammateDialog
                isOwner={isOwner}
                onError={setError}
                trigger={
                  <QuickAccessButton
                    icon={<UserPlus className="size-5" />}
                    title="Invite teammate"
                    description="Create an invitation link for a specific email."
                  />
                }
              />

              <TeamCreateDialog
                trigger={
                  <QuickAccessButton
                    icon={<Users2 className="size-5" />}
                    title="Create another team"
                    description="Spin up a new workspace and switch to it."
                  />
                }
              />

              <DeleteTeamDialog
                teamTitle={team.title}
                isDeleting={isDeleting}
                onConfirm={handleDeleteTeam}
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
        ) : null}

        {isOwner ? (
          <section className="py-8">
          <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Invitations
              </h3>
              <p className="text-sm text-muted-foreground">
                Invitation links created for this team.
              </p>
            </div>

            <SearchInput
              value={invitationSearch}
              onChange={setInvitationSearch}
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
                {paginatedInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      {filteredInvitations.length === 0
                        ? "No invitations match this search."
                        : "No invitations on this page."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvitations.map((invitation) => (
                    <TableRow key={invitation._id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell className="capitalize">
                        {invitation.status}
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyInvitation(invitation.token)
                            }
                          >
                            <Copy className="size-3.5" />
                            {copiedToken === invitation.token
                              ? "Copied"
                              : "Copy link"}
                          </Button>
                          {isOwner && invitation.status === "pending" ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleRevoke(invitation._id, invitation.email)
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
            currentPage={invitationsPage}
            totalPages={invitationPageCount}
            onPageChange={setInvitationsPage}
            itemLabel={`${filteredInvitations.length} invitation${
              filteredInvitations.length === 1 ? "" : "s"
            }`}
          />
          </section>
        ) : null}

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
              onChange={setMemberSearch}
              placeholder="Search members"
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email / User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      {filteredMembers.length === 0
                        ? "No members match this search."
                        : "No members on this page."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMembers.map((member) => {
                    const label = member.name ?? member.email ?? member.userId;
                    const isCurrentUser = member.userId === membership.userId;
                    const canEditRole =
                      isOwner && !(isCurrentUser && member.role === "owner");
                    const canRemoveMember =
                      isOwner && !(isCurrentUser && member.role === "owner");

                    return (
                      <TableRow key={member._id}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell className="max-w-[280px] truncate">
                          {member.email || member.userId}
                        </TableCell>
                        <TableCell>
                          {canEditRole ? (
                            <select
                              value={member.role}
                              onChange={(event) =>
                                handleRoleChange(
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
                                onClick={() =>
                                  handleRemove(member._id, label)
                                }
                              >
                                <Trash2 className="size-3.5" />
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
            currentPage={membersPage}
            totalPages={memberPageCount}
            onPageChange={setMembersPage}
            itemLabel={`${filteredMembers.length} member${
              filteredMembers.length === 1 ? "" : "s"
            }`}
          />
        </section>
      </div>
    </AppShell>
  );
}

function QuickAccessButton({
  icon,
  title,
  description,
  destructive = false,
  disabled = false,
  className,
  ...props
}: {
  icon: ReactNode;
  title: string;
  description: string;
  destructive?: boolean;
  disabled?: boolean;
} & React.ComponentProps<"button">) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={disabled}
      {...props}
      className={cn(
        "flex h-auto min-h-28 w-full flex-col items-start justify-between rounded-2xl px-4 py-4 text-left whitespace-normal",
        destructive && "border-destructive/40 hover:bg-muted/40",
        className,
      )}
    >
      <div
        className={`flex size-10 items-center justify-center rounded-2xl ${
          destructive ? "bg-destructive/10" : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        <div
          className={cn(
            "mt-1 text-xs leading-6",
            "text-muted-foreground",
          )}
        >
          {description}
        </div>
      </div>
    </Button>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-xl pl-10 text-sm"
      />
    </div>
  );
}

function SectionPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemLabel,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemLabel: string;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground">{itemLabel}</p>
      <Pagination className="mx-0 w-auto justify-start md:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (currentPage > 1) {
                  onPageChange(currentPage - 1);
                }
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="inline-flex h-9 items-center rounded-md border px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (currentPage < totalPages) {
                  onPageChange(currentPage + 1);
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function TeamSettingsDialog({
  team,
  isOwner,
  onError,
  trigger,
}: {
  team: { title: string; description: string };
  isOwner: boolean;
  onError: (value: string | null) => void;
  trigger: ReactNode;
}) {
  const updateTeam = useMutation(api.teams.updateTeam);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(team.title);
  const [description, setDescription] = useState(team.description);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(team.title);
      setDescription(team.description);
    }
  }, [open, team.description, team.title]);

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      onError(null);
      await updateTeam({
        title: title.trim(),
        description: description.trim(),
      });
      setOpen(false);
    } catch (submissionError) {
      onError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to update the team.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Team settings</DialogTitle>
          <DialogDescription>
            Update the team title and description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              disabled={!isOwner}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 h-11 rounded-xl px-4 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              disabled={!isOwner}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={!isOwner || isSubmitting}
            className="rounded-xl px-4"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteTeammateDialog({
  isOwner,
  onError,
  trigger,
}: {
  isOwner: boolean;
  onError: (value: string | null) => void;
  trigger: ReactNode;
}) {
  const createInvitation = useMutation(api.teams.createInvitation);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      onError(null);
      await createInvitation({ email: email.trim() });
      setEmail("");
      setOpen(false);
    } catch (submissionError) {
      onError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to create invitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite teammate</DialogTitle>
          <DialogDescription>
            Create an invitation link tied to a specific email address.
          </DialogDescription>
        </DialogHeader>

        <div>
          <label className="text-sm font-medium">Invitee email</label>
          <Input
            value={email}
            disabled={!isOwner}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seller@company.com"
            className="mt-2 h-11 rounded-xl px-4 text-sm"
          />
        </div>

        <DialogFooter showCloseButton>
          <Button
            onClick={handleSubmit}
            disabled={!isOwner || isSubmitting}
            className="rounded-xl px-4"
          >
            {isSubmitting ? "Creating..." : "Create invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTeamDialog({
  teamTitle,
  isDeleting,
  onConfirm,
  trigger,
}: {
  teamTitle: string;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    await onConfirm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delete team</DialogTitle>
          <DialogDescription>
            Deleting {teamTitle} will permanently remove calls, analyses,
            feedback, notifications, invitations, and memberships for this
            workspace.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded-xl px-4"
          >
            {isDeleting ? "Deleting..." : "Delete team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
