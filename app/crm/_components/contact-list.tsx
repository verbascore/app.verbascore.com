"use client";

type Contact = {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  jobTitle?: string;
  lifecycleStage: string;
  notes?: string;
  tags: string[];
  organization?: {
    name: string;
  } | null;
};

export function ContactList({
  contacts,
  search,
  onSearchChange,
}: {
  contacts: Contact[];
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section className="rounded-3xl border bg-card/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Contact book
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">
            Team contacts
          </h3>
        </div>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name, phone, company"
          className="h-11 w-full rounded-2xl border bg-background px-4 text-sm outline-none transition focus:border-primary lg:max-w-xs"
        />
      </div>

      <div className="mt-5 space-y-3">
        {contacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-background/70 p-6 text-sm text-muted-foreground">
            No contacts match the current view yet.
          </div>
        ) : (
          contacts.map((contact) => (
            <article
              key={contact._id}
              className="rounded-2xl border bg-background/70 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-semibold">{contact.fullName}</h4>
                    <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {contact.lifecycleStage}
                    </span>
                    {contact.organization?.name ? (
                      <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                        {contact.organization.name}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-base font-medium tracking-tight">
                    {contact.phoneNumber}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[contact.jobTitle, contact.email].filter(Boolean).join(" · ") ||
                      "No role or email yet"}
                  </p>
                </div>

                {contact.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 lg:max-w-[16rem] lg:justify-end">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {contact.notes ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {contact.notes}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
