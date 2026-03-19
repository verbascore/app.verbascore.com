"use client";

import { PageHeader } from "@/components/page-header";

import { NotificationLevel } from "./types";

type NotificationsHeaderProps = {
  filter: "all" | NotificationLevel;
  onFilterChange: (filter: "all" | NotificationLevel) => void;
};

export function NotificationsHeader({
  filter,
  onFilterChange,
}: NotificationsHeaderProps) {
  const filters: Array<"all" | NotificationLevel> = [
    "all",
    "critical",
    "warning",
    "info",
  ];

  return (
    <PageHeader
      eyebrow="Alerts"
      title="Notifications"
      description="Stay on top of analysis alerts, coaching signals, and important activity across the workspace."
    >
      <div className="inline-flex rounded-2xl border bg-card/70 p-1">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onFilterChange(item)}
            className={`rounded-xl px-5 py-2 text-sm font-medium capitalize transition-colors ${
              filter === item
                ? "bg-primary/20 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item === "all" ? "All" : item}
          </button>
        ))}
      </div>
    </PageHeader>
  );
}
