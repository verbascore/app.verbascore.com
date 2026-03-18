"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import { OwnerNotificationsView } from "./_components/owner-notifications-view";
import { SellerNotificationsView } from "./_components/seller-notifications-view";
import { NotificationItem, NotificationLevel } from "./_components/types";

export default function NotificationsPage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const notifications = useQuery(
    api.notifications.listNotifications,
    workspace?.team ? {} : "skip",
  ) as
    | NotificationItem[]
    | undefined;
  const [filter, setFilter] = useState<"all" | NotificationLevel>("all");

  const filtered = useMemo(() => {
    if (!notifications) {
      return [];
    }

    return filter === "all"
      ? notifications
      : notifications.filter((notification) => notification.level === filter);
  }, [filter, notifications]);

  if (!workspace) {
    return (
      <AppShell activeHref="/notifications" title="Notifications">
        <section className="mt-8 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
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
      activeHref="/notifications"
      title="Notifications"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
    >
      {workspace.membership.role === "owner" ? (
        <OwnerNotificationsView
          notifications={notifications}
          filtered={filtered}
          filter={filter}
          onFilterChange={setFilter}
        />
      ) : (
        <SellerNotificationsView
          notifications={notifications}
          filtered={filtered}
          filter={filter}
          onFilterChange={setFilter}
        />
      )}
    </AppShell>
  );
}
