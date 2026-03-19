import Link from "next/link";

export function OwnerFeedbackEmptyState({
  selectedSeller,
}: {
  selectedSeller: string;
}) {
  const isAverage = selectedSeller === "average";

  return (
    <section className="mt-6 rounded-3xl border bg-card/90 p-10 text-center shadow-sm">
      <p className="text-sm text-muted-foreground">
        No feedback snapshot has been generated for this scope yet.
      </p>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">
        {isAverage
          ? "Your team needs analyzed seller calls to unlock coaching feedback"
          : "This seller needs an analyzed call to unlock coaching feedback"}
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
        {isAverage
          ? "Manager feedback is generated from analyzed seller calls across the team. Once analyses start completing, this view will fill with shared coaching priorities and action items."
          : "Seller feedback appears automatically after this teammate completes a call analysis. Once that happens, you will see focus areas and coaching recommendations here."}
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
