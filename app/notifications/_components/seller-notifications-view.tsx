"use client";

import { NotificationsHeader } from "./notifications-header";
import { NotificationsList } from "./notifications-list";
import { NotificationItem, NotificationLevel } from "./types";

export function SellerNotificationsView({
  notifications,
  filtered,
  filter,
  onFilterChange,
}: {
  notifications: NotificationItem[] | undefined;
  filtered: NotificationItem[];
  filter: "all" | NotificationLevel;
  onFilterChange: (value: "all" | NotificationLevel) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <NotificationsHeader filter={filter} onFilterChange={onFilterChange} />

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
  );
}
