import Link from "next/link";

export function AnalyticsEmptyState() {
  return (
    <section className="mt-6 rounded-3xl border bg-card/90 p-10 text-center shadow-sm">
      <p className="text-sm text-muted-foreground">
        No analytics snapshot has been generated yet.
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">
        Analyze your first sales call to unlock analytics
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
        Snapshots are created automatically after a call analysis completes.
        They summarize up to the three most recently analyzed calls, with the
        newest one weighted first.
      </p>
      <Link
        href="/calls"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Go to sales calls
      </Link>
    </section>
  );
}
