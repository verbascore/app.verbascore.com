"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ChevronsUpDown, Plus, Users2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { TeamCreateDialog } from "@/components/team-create-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSidebarSwitcher() {
  const router = useRouter();
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const switchTeam = useMutation(api.teams.switchTeam);

  if (!workspace?.team || !workspace.membership) {
    return (
      <TeamCreateDialog
        trigger={
          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-sidebar-accent">
            <Plus className="size-4" />
            Create team
          </button>
        }
      />
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="h-11 rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 px-3 text-sm">
              <Users2 />
              <div className="grid flex-1 text-left">
                <span>{workspace.team.title}</span>
                <span className="text-[11px] text-sidebar-foreground/60">
                  {workspace.membership.role}
                </span>
              </div>
              <ChevronsUpDown className="size-4 opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" side="top" className="w-72">
            <DropdownMenuLabel>Your teams</DropdownMenuLabel>
            {workspace.teams.map((team) => (
              <DropdownMenuItem
                key={team._id}
                onSelect={() => switchTeam({ teamId: team._id as never })}
                className="flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{team.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {team.role}
                  </div>
                </div>
                {team._id === workspace.team?._id ? (
                  <span className="text-[11px] text-muted-foreground">
                    Active
                  </span>
                ) : null}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => router.push("/team")}>
              Manage team
            </DropdownMenuItem>

            <TeamCreateDialog
              trigger={
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Plus className="size-4" />
                  Create team
                </button>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
