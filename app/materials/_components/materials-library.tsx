"use client";

import { Search } from "lucide-react";

import { materialTypeMeta, materialsCatalog } from "@/lib/materials";

import { MaterialCard } from "./material-card";
import { MaterialFilter } from "./types";
import { matchesFilter } from "./utils";

type MaterialsLibraryProps = {
  filter: MaterialFilter;
  search: string;
  onFilterChange: (filter: MaterialFilter) => void;
  onSearchChange: (value: string) => void;
};

export function MaterialsLibrary({
  filter,
  search,
  onFilterChange,
  onSearchChange,
}: MaterialsLibraryProps) {
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = materialsCatalog.filter((material) => {
    if (!matchesFilter(material, filter)) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return (
      material.title.toLowerCase().includes(normalizedSearch) ||
      material.summary.toLowerCase().includes(normalizedSearch) ||
      material.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
    );
  });

  const filters: MaterialFilter[] = [
    "all",
    "script",
    "video",
    "article",
    "best_practice",
  ];

  return (
    <section className="mt-10">
      <p className="text-2xl font-semibold tracking-tight">Full Library</p>

      <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-[460px]">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search materials..."
            className="h-12 w-full rounded-2xl border bg-card/80 pl-11 pr-4 text-sm outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onFilterChange(item)}
              className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors ${
                filter === item
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border bg-card/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item === "all" ? "All" : materialTypeMeta[item].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {filtered.map((material) => (
          <MaterialCard key={material.slug} material={material} />
        ))}
      </div>
    </section>
  );
}
