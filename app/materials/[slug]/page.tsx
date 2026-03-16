"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { getMaterialBySlug, materialTypeMeta } from "@/lib/materials";

export default function MaterialDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0];
  const material = slug ? getMaterialBySlug(slug) : null;

  if (!material) {
    return (
      <AppShell activeHref="/materials" title="Materials">
        <section className="rounded-3xl border bg-card/90 p-8 shadow-sm">
          <p className="text-sm text-muted-foreground">Material not found.</p>
          <Link
            href="/materials"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium"
          >
            Back to materials
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell activeHref="/materials" title="Materials">
      <section className="rounded-3xl border bg-card/90 p-8 shadow-sm">
        <Link
          href="/materials"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to materials
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-xl border px-3 py-1 text-xs font-medium text-muted-foreground">
            {materialTypeMeta[material.type].shortLabel}
          </span>
          <span className="rounded-xl border px-3 py-1 text-xs font-medium text-muted-foreground">
            {material.level}
          </span>
          {material.duration ? (
            <span className="rounded-xl border px-3 py-1 text-xs font-medium text-muted-foreground">
              {material.duration}
            </span>
          ) : null}
        </div>

        <h2 className="mt-5 text-4xl font-semibold tracking-tight">
          {material.title}
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-muted-foreground">
          {material.description}
        </p>

        <div className="mt-8 rounded-3xl border bg-background/50 p-6">
          <p className="text-base font-semibold tracking-tight">Summary</p>
          <p className="mt-3 text-sm leading-8 text-muted-foreground">
            {material.summary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {material.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-xl bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
