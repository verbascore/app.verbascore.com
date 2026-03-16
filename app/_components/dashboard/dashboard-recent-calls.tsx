"use client";

import Link from "next/link";

import { DashboardCall } from "./types";
import { formatDateTime } from "./utils";

export function DashboardRecentCalls({ calls }: { calls: DashboardCall[] }) {
  return (
    <section className="self-start min-h-[24rem] rounded-3xl border bg-card/80 p-6 shadow-sm">
      <p className="text-2xl font-semibold tracking-tight">Recent Calls</p>
      <div className="mt-6 space-y-3">
        {calls.length > 0 ? (
          calls.map((call) => (
            <Link
              key={call._id}
              href={`/calls/${call._id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border bg-background/40 px-4 py-3 transition-colors hover:bg-background/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{call.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(call.createdAt)}
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  call.overallRating && call.overallRating >= 80
                    ? "bg-lime-500/10 text-lime-300"
                    : call.overallRating
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {call.overallRating ?? "—"}
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm leading-7 text-muted-foreground">
            No calls uploaded yet.
          </p>
        )}
      </div>
    </section>
  );
}
