"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";

export default function Page() {
  return (
    <AppShell activeHref="/" title="Dashboard">
      <section className="rounded-3xl border bg-card/90 p-6 shadow-sm backdrop-blur">
        <p className="text-sm text-muted-foreground">
          Clerk authentication and Convex are now connected.
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Turn every conversation into measurable revenue.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          The workspace is ready. Head to sales calls to upload recordings,
          trigger AI analysis, and review results.
        </p>
        <Link
          href="/calls"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open sales calls
        </Link>
      </section>
    </AppShell>
  );
}
