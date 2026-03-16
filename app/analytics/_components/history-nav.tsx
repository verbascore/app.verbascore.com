"use client";

import { AnalyticsSnapshot } from "./types";
import { formatDateTime } from "./utils";

type HistoryNavProps = {
  snapshots: AnalyticsSnapshot[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
};

export function HistoryNav({
  snapshots,
  selectedIndex,
  onSelectIndex,
}: HistoryNavProps) {
  const selectedSnapshot = snapshots[selectedIndex];

  return (
    <section className="mt-6 flex flex-col gap-4 rounded-3xl border bg-card/80 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Snapshot History
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Viewing snapshot from {formatDateTime(selectedSnapshot.createdAt)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Based on: {selectedSnapshot.sourceCallTitles.join(" / ")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={selectedIndex >= snapshots.length - 1}
          onClick={() => onSelectIndex(selectedIndex + 1)}
          className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          Older
        </button>
        <button
          type="button"
          disabled={selectedIndex === 0}
          onClick={() => onSelectIndex(selectedIndex - 1)}
          className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          Newer
        </button>
        {snapshots.map((snapshot, index) => (
          <button
            key={snapshot._id}
            type="button"
            onClick={() => onSelectIndex(index)}
            className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors ${
              selectedIndex === index
                ? "border-primary/30 bg-primary/10 text-foreground"
                : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {index === 0 ? "Latest" : formatDateTime(snapshot.createdAt)}
          </button>
        ))}
      </div>
    </section>
  );
}
