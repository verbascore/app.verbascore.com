"use client";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import { DashboardHeader } from "./_components/dashboard/dashboard-header";
import { OwnerDashboardView } from "./_components/dashboard/owner-dashboard-view";
import { SellerDashboardView } from "./_components/dashboard/seller-dashboard-view";
import { HomeDashboardData } from "./_components/dashboard/types";

export default function Page() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const data = useQuery(
    api.dashboard.getHomeDashboard,
    workspace?.team ? {} : "skip",
  ) as
    | HomeDashboardData
    | undefined;

  if (!workspace) {
    return (
      <AppShell activeHref="/" title="Dashboard">
        <section className="mt-6 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Loading workspace...
        </section>
      </AppShell>
    );
  }

  if (!workspace.team || !workspace.membership) {
    return <TeamEmptyState />;
  }

  return (
    <AppShell
      activeHref="/"
      title="Dashboard"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
    >
      <DashboardHeader />
      {workspace.membership.role === "owner" ? (
        <OwnerDashboardView data={data} />
      ) : (
        <SellerDashboardView data={data} />
      )}
    </AppShell>
  );
}
