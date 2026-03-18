"use client";

import { DashboardBreakdownCard } from "./dashboard-breakdown-card";
import { DashboardQuickAccess } from "./dashboard-quick-access";
import { DashboardRecentCalls } from "./dashboard-recent-calls";
import { DashboardStatCards } from "./dashboard-stat-cards";
import { DashboardStrengthsCard } from "./dashboard-strengths-card";
import { DashboardTrendCard } from "./dashboard-trend-card";
import { TeamWorkspaceCard } from "./team-workspace-card";
import { HomeDashboardData } from "./types";

export function SellerDashboardView({
  data,
  teamTitle,
  teamDescription,
  memberCount,
  role,
}: {
  data: HomeDashboardData | undefined;
  teamTitle: string;
  teamDescription: string;
  memberCount: number;
  role: "owner" | "seller";
}) {
  return (
    <>
      <div className="mt-6">
        <TeamWorkspaceCard
          title={teamTitle}
          description={teamDescription}
          memberCount={memberCount}
          role={role}
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
    </>
  );
}
