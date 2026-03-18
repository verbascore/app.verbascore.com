import { ReactNode } from "react";

export function FeedbackHeader({ scopeControl }: { scopeControl?: ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card/90 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            AI-generated insights and action items for improvement
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">Feedback</h2>
        </div>
        {scopeControl}
      </div>
    </section>
  );
}
