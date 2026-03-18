"use client";

import { useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

import { MaterialFilter } from "./_components/types";
import { MaterialsDashboardData } from "./_components/types";
import { MaterialsHeader } from "./_components/materials-header";
import { MaterialsLibrary } from "./_components/materials-library";
import { RecommendedMaterials } from "./_components/recommended-materials";

export default function MaterialsPage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const data = useQuery(
    api.dashboard.getHomeDashboard,
    workspace?.team ? {} : "skip",
  ) as
    | MaterialsDashboardData
    | undefined;
  const [filter, setFilter] = useState<MaterialFilter>("all");
  const [search, setSearch] = useState("");

  if (!workspace) {
    return (
      <AppShell activeHref="/materials" title="Materials">
        <section className="mt-6 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
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
      activeHref="/materials"
      title="Materials"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
    >
      <MaterialsHeader />
      <RecommendedMaterials
        recommendedTitles={data?.recommendedMaterials ?? []}
      />
      <MaterialsLibrary
        filter={filter}
        search={search}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
      />
    </AppShell>
  );
}
