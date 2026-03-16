"use client";

import { NotificationCard } from "./notification-card";
import { NotificationItem } from "./types";
import { formatDayLabel } from "./utils";

export function NotificationsList({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const grouped = notifications.reduce(
    (accumulator, notification) => {
      const label = formatDayLabel(notification.createdAt);
      accumulator[label] ??= [];
      accumulator[label].push(notification);
      return accumulator;
    },
    {} as Record<string, NotificationItem[]>,
  );

  return (
    <div className="mt-8 space-y-8">
      {Object.entries(grouped).map(([label, items]) => (
        <section key={label}>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <div className="mt-4 space-y-4">
            {items.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
