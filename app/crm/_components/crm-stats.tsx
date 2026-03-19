type Stat = {
  label: string;
  value: string;
  detail: string;
};

export function CrmStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-3xl border bg-card/90 p-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {stat.label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {stat.value}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{stat.detail}</p>
        </div>
      ))}
    </section>
  );
}
