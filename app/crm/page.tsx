"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";

import { ActivityFeed } from "@/app/crm/_components/activity-feed";
import { ContactList } from "@/app/crm/_components/contact-list";
import { CrmStats } from "@/app/crm/_components/crm-stats";
import { IntegrationPanel } from "@/app/crm/_components/integration-panel";
import { OrganizationList } from "@/app/crm/_components/organization-list";
import { QuickCaptureForm } from "@/app/crm/_components/quick-capture-form";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TeamEmptyState } from "@/components/team-empty-state";
import { api } from "@/convex/_generated/api";

export default function CrmPage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const overview = useQuery(api.crm.getOverview, workspace?.team ? {} : "skip");
  const createContact = useMutation(api.crm.createContact);

  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickCapture, setQuickCapture] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    organizationName: "",
    jobTitle: "",
    notes: "",
  });

  const filteredContacts = useMemo(() => {
    const contacts = overview?.contacts ?? [];
    const term = search.trim().toLowerCase();

    if (!term) {
      return contacts;
    }

    return contacts.filter((contact) =>
      [
        contact.fullName,
        contact.phoneNumber,
        contact.email,
        contact.organization?.name,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [overview?.contacts, search]);

  async function handleCreateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      await createContact({
        fullName: quickCapture.fullName.trim(),
        phoneNumber: quickCapture.phoneNumber.trim(),
        email: quickCapture.email.trim() || undefined,
        organizationName: quickCapture.organizationName.trim() || undefined,
        jobTitle: quickCapture.jobTitle.trim() || undefined,
        notes: quickCapture.notes.trim() || undefined,
      });
      setQuickCapture({
        fullName: "",
        phoneNumber: "",
        email: "",
        organizationName: "",
        jobTitle: "",
        notes: "",
      });
      return true;
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to save the contact.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!workspace) {
    return (
      <AppShell activeHref="/crm" title="CRM">
        <section className="border-b pb-6 text-sm text-muted-foreground">
          Loading workspace...
        </section>
      </AppShell>
    );
  }

  if (!workspace.team || !workspace.membership) {
    return <TeamEmptyState />;
  }

  return (
    <AppShell
      activeHref="/crm"
      title="CRM"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="CRM"
          title="Contacts, accounts, and sync-ready customer data"
          description="Built as a fast team CRM inside VerbaScore: a shared contact book for client phone numbers, lightweight account context, and an integration surface ready for external CRM sync."
        />

        <CrmStats
          stats={[
            {
              label: "Contacts",
              value: String(overview?.stats.contactCount ?? 0),
              detail: "Team-owned records with normalized phone numbers.",
            },
            {
              label: "Accounts",
              value: String(overview?.stats.organizationCount ?? 0),
              detail: "Organizations tied to your contacts and outreach.",
            },
            {
              label: "Reachable",
              value: String(overview?.stats.withEmailCount ?? 0),
              detail: "Contacts with email captured alongside phone data.",
            },
            {
              label: "Customers",
              value: String(overview?.stats.activeCustomersCount ?? 0),
              detail: "Contacts currently marked as customers.",
            },
            {
              label: "Syncs",
              value: String(overview?.stats.connectionCount ?? 0),
              detail: "Connected or ready-to-connect CRM providers.",
            },
          ]}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
          <div className="space-y-6">
            <ContactList
              contacts={filteredContacts}
              search={search}
              onSearchChange={setSearch}
            />
            <ActivityFeed activities={overview?.activities ?? []} />
          </div>

          <div className="space-y-6">
            <QuickCaptureForm
              values={quickCapture}
              onChange={(field, value) =>
                setQuickCapture((current) => ({ ...current, [field]: value }))
              }
              onSubmit={handleCreateContact}
              isSubmitting={isSubmitting}
              error={error}
            />
            <OrganizationList organizations={overview?.organizations ?? []} />
            <IntegrationPanel connections={overview?.connections ?? []} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
