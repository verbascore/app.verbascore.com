"use client";

import Link from "next/link";
import { BookOpen, FileText, Lightbulb, Video } from "lucide-react";

import { MaterialType } from "@/lib/materials";

import { MaterialCardProps } from "./types";
import { typeLabel } from "./utils";

const icons: Record<MaterialType, typeof FileText> = {
  script: FileText,
  video: Video,
  article: BookOpen,
  best_practice: Lightbulb,
};

export function MaterialCard({ material, compact = false }: MaterialCardProps) {
  const Icon = icons[material.type];

  return (
    <Link
      href={`/materials/${material.slug}`}
      className={`group rounded-3xl border bg-card/80 p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-card ${
        compact ? "" : "min-h-[13rem]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <span className="rounded-xl border px-3 py-1 text-xs font-medium text-muted-foreground">
          {typeLabel(material.type)}
        </span>
      </div>

      <p className="mt-5 text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
        {material.title}
      </p>
      <p className="mt-3 text-base text-muted-foreground">
        {compact ? material.summary : material.description}
      </p>

      {!compact ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {material.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-xl bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
