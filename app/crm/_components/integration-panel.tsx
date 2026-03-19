type Connection = {
  _id: string;
  provider: string;
  displayName: string;
  status: "active" | "needs_attention" | "disabled";
  lastSyncedAt?: number;
};

function formatSync(timestamp?: number) {
  if (!timestamp) {
    return "Not synced yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export function IntegrationPanel({
  connections,
}: {
  connections: Connection[];
}) {
  return (
    <section className="rounded-3xl border bg-card/90 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Integrations
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">
        CRM sync surface
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        The schema already supports provider connections and external entity IDs for
        imports from systems like HubSpot, Salesforce, and Pipedrive.
      </p>

      <div className="mt-5 space-y-3">
        {connections.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-background/70 p-5 text-sm text-muted-foreground">
            No CRM integrations connected yet.
          </div>
        ) : (
          connections.map((connection) => (
            <article
              key={connection._id}
              className="rounded-2xl border bg-background/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{connection.displayName}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {connection.provider}
                  </p>
                </div>
                <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {connection.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Last sync: {formatSync(connection.lastSyncedAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
