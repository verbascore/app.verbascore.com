import Link from "next/link";

export function OwnerAnalyticsEmptyState({
  selectedSeller,
}: {
  selectedSeller: string;
}) {
  const isAverage = selectedSeller === "average";

  return (
    <section className="mt-6 rounded-3xl border bg-card/90 p-10 text-center shadow-sm">
      <p className="text-sm text-muted-foreground">
        No analytics snapshot has been generated for this scope yet.
      </p>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">
        {isAverage
          ? "Your team needs analyzed seller calls to unlock analytics"
          : "This seller needs an analyzed call to unlock analytics"}
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
        {isAverage
          ? "Team analytics are built from analyzed seller calls. Once your sellers start completing call analyses, you will see shared trend data and score history here."
          : "Seller analytics appear automatically after this teammate has at least one completed call analysis. Once that happens, score trends and objection patterns will show up here."}
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
