type DashboardStrengthsCardProps = {
  strengths: string[];
  weaknesses: string[];
};

export function DashboardStrengthsCard({
  strengths,
  weaknesses,
}: DashboardStrengthsCardProps) {
  return (
    <section className="self-start min-h-[24rem] rounded-3xl border bg-card/80 p-6 shadow-sm">
      <p className="text-lg font-semibold tracking-tight">
        Strengths & Weaknesses
      </p>

      <div className="mt-6">
        <p className="text-base font-medium text-lime-400">Strengths</p>
        <div className="mt-3 space-y-2">
          {strengths.length > 0 ? (
            strengths.map((item) => (
              <p key={item} className="text-base text-muted-foreground">
                • {item}
              </p>
            ))
          ) : (
            <p className="text-base text-muted-foreground">
              Analyze a few calls to surface strengths automatically.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-base font-medium text-amber-400">
          Areas for Improvement
        </p>
        <div className="mt-3 space-y-2">
          {weaknesses.length > 0 ? (
            weaknesses.map((item) => (
              <p key={item} className="text-base text-muted-foreground">
                • {item}
              </p>
            ))
          ) : (
            <p className="text-base text-muted-foreground">
              No major weaknesses surfaced in the latest snapshot.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
