import { Target } from "lucide-react";

export function FocusCard({ focusItems }: { focusItems: string[] }) {
  return (
    <section className="mt-6 rounded-3xl border bg-card/80 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
          <Target className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight">
            Focus for Your Next 5 Calls
          </p>
          <div className="mt-4 space-y-3">
            {focusItems.map((item, index) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-semibold text-cyan-300">
                  {index + 1}
                </div>
                <p className="text-base text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
