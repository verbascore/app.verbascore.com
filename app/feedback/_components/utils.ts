export function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export function priorityClasses(priority: "high" | "medium" | "low") {
  if (priority === "high") {
    return "border-rose-500/20 bg-rose-500/8 text-rose-300";
  }

  if (priority === "medium") {
    return "border-amber-500/20 bg-amber-500/8 text-amber-300";
  }

  return "border-emerald-500/20 bg-emerald-500/8 text-emerald-300";
}

export function statusClasses(status: "new" | "in_progress" | "watch") {
  if (status === "in_progress") {
    return "border-orange-500/20 bg-orange-500/8 text-orange-300";
  }

  if (status === "watch") {
    return "border-cyan-500/20 bg-cyan-500/8 text-cyan-300";
  }

  return "border-sky-500/20 bg-sky-500/8 text-sky-300";
}

export function formatStatus(status: "new" | "in_progress" | "watch") {
  if (status === "in_progress") {
    return "In Progress";
  }

  if (status === "watch") {
    return "Watch";
  }

  return "New";
}
