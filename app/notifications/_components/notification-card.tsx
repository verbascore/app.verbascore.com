"use client";

import Link from "next/link";
import { AlertTriangle, Bookmark, Eye, Info, BellRing } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

import { NotificationItem } from "./types";
import { levelClasses } from "./utils";

function NotificationIcon({ level }: { level: NotificationItem["level"] }) {
  if (level === "critical") {
    return <AlertTriangle className="size-5" />;
  }

  if (level === "warning") {
    return <BellRing className="size-5" />;
  }

  return <Info className="size-5" />;
}

export function NotificationCard({
  notification,
}: {
  notification: NotificationItem;
}) {
  const toggleBookmark = useMutation(api.notifications.toggleBookmark);
  const snoozeNotification = useMutation(api.notifications.snoozeNotification);
  const styles = levelClasses(notification.level);

  return (
    <article
      className={`rounded-3xl border bg-card/80 p-6 shadow-sm ${styles.card}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}
        >
          <NotificationIcon level={notification.level} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold tracking-tight">
            {notification.title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {notification.message}
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            {notification.href ? (
              <Link
                href={notification.href}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 font-medium transition-colors hover:bg-background/50"
              >
                <Eye className="size-4" />
                View
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() =>
                toggleBookmark({ notificationId: notification._id as never })
              }
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 font-medium transition-colors hover:bg-background/50 ${
                notification.isBookmarked
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Bookmark className="size-4" />
              {notification.isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>

            <button
              type="button"
              onClick={() =>
                snoozeNotification({
                  notificationId: notification._id as never,
                })
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 font-medium text-muted-foreground transition-colors hover:bg-background/50"
            >
              Snooze
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
