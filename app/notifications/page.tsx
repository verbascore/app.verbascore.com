"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";

import { NotificationsHeader } from "./_components/notifications-header";
import { NotificationsList } from "./_components/notifications-list";
import { NotificationItem, NotificationLevel } from "./_components/types";

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.listNotifications) as
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

  return (
    <AppShell activeHref="/notifications" title="Notifications">
      <div className="mx-auto w-full max-w-5xl">
        <NotificationsHeader filter={filter} onFilterChange={setFilter} />

        {!notifications ? (
          <section className="mt-8 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
            Loading notifications...
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-8 rounded-3xl border bg-card/80 p-8 text-sm text-muted-foreground shadow-sm">
            No notifications for this filter yet.
          </section>
        ) : (
          <NotificationsList notifications={filtered} />
        )}
      </div>
    </AppShell>
  );
}
