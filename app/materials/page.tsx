"use client";

import { useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";

import { MaterialFilter } from "./_components/types";
import { MaterialsDashboardData } from "./_components/types";
import { MaterialsHeader } from "./_components/materials-header";
import { MaterialsLibrary } from "./_components/materials-library";
import { RecommendedMaterials } from "./_components/recommended-materials";

export default function MaterialsPage() {
  const data = useQuery(api.dashboard.getHomeDashboard) as
    | MaterialsDashboardData
    | undefined;
  const [filter, setFilter] = useState<MaterialFilter>("all");
  const [search, setSearch] = useState("");

  return (
    <AppShell activeHref="/materials" title="Materials">
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
