type Organization = {
  _id: string;
  name: string;
  website?: string;
  industry?: string;
  lifecycleStage: string;
};

export function OrganizationList({
  organizations,
}: {
  organizations: Organization[];
}) {
  return (
    <section className="rounded-3xl border bg-card/90 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Accounts
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">
        Organizations
      </h3>

      <div className="mt-5 space-y-3">
        {organizations.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-background/70 p-5 text-sm text-muted-foreground">
            No organizations yet. They will appear as contacts are grouped by company.
          </div>
        ) : (
          organizations.map((organization) => (
            <article
              key={organization._id}
              className="rounded-2xl border bg-background/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{organization.name}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[organization.industry, organization.website]
                      .filter(Boolean)
                      .join(" · ") || "No industry or website yet"}
                  </p>
                </div>
                <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {organization.lifecycleStage.replace("_", " ")}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
