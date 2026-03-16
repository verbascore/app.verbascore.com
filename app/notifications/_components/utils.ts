import { NotificationLevel } from "./types";

export function formatDayLabel(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
  }).format(date);
}

export function levelClasses(level: NotificationLevel) {
  if (level === "critical") {
    return {
      card: "border-rose-500/20",
      icon: "bg-rose-500/10 text-rose-300",
    };
  }

  if (level === "warning") {
    return {
      card: "border-amber-500/20",
      icon: "bg-amber-500/10 text-amber-300",
    };
  }

  return {
    card: "border-cyan-500/20",
    icon: "bg-cyan-500/10 text-cyan-300",
  };
}
