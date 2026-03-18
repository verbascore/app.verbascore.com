"use client";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import { DashboardBreakdownCard } from "./_components/dashboard/dashboard-breakdown-card";
import { DashboardHeader } from "./_components/dashboard/dashboard-header";
import { DashboardQuickAccess } from "./_components/dashboard/dashboard-quick-access";
import { DashboardRecentCalls } from "./_components/dashboard/dashboard-recent-calls";
import { DashboardStatCards } from "./_components/dashboard/dashboard-stat-cards";
import { DashboardStrengthsCard } from "./_components/dashboard/dashboard-strengths-card";
import { TeamWorkspaceCard } from "./_components/dashboard/team-workspace-card";
import { DashboardTrendCard } from "./_components/dashboard/dashboard-trend-card";
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
    return (
      <AppShell activeHref="/" title="Dashboard">
        <TeamEmptyState />
      </AppShell>
    );
  }

  return (
    <AppShell
      activeHref="/"
      title="Dashboard"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
    >
      <DashboardHeader />

      <div className="mt-6">
        <TeamWorkspaceCard
          title={workspace.team.title}
          description={workspace.team.description}
          memberCount={workspace.members.length}
          role={workspace.membership.role}
        />
      </div>

      {!data ? (
        <section className="mt-6 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Loading dashboard...
        </section>
      ) : (
        <>
          <DashboardStatCards
            analytics={data.latestAnalytics}
            analyzedCallsCount={data.analyzedCallsCount}
          />

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.85fr)]">
            <DashboardTrendCard analytics={data.latestAnalytics} />
            <DashboardBreakdownCard analytics={data.latestAnalytics} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)_minmax(300px,0.8fr)]">
            <DashboardStrengthsCard
              strengths={data.strengths}
              weaknesses={data.weaknesses}
            />
            <DashboardQuickAccess />
            <DashboardRecentCalls calls={data.recentCalls} />
          </div>
        </>
      )}
    </AppShell>
  );
}
