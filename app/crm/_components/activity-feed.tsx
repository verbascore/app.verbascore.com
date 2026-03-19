type Activity = {
  _id: string;
  kind: string;
  summary: string;
  details?: string;
  createdAt: number;
};

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <section className="rounded-3xl border bg-card/90 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Timeline
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">
        Recent CRM activity
      </h3>

      <div className="mt-5 space-y-3">
        {activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-background/70 p-5 text-sm text-muted-foreground">
            No CRM activity yet.
          </div>
        ) : (
          activities.map((activity) => (
            <article
              key={activity._id}
              className="rounded-2xl border bg-background/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {activity.kind}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(activity.createdAt)}
                </p>
              </div>
              <p className="mt-2 font-medium">{activity.summary}</p>
              {activity.details ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {activity.details}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
