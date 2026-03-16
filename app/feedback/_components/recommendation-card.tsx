"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

import { getMaterialByTitle } from "@/lib/materials";

import { FeedbackRecommendation } from "./types";
import { formatStatus, priorityClasses, statusClasses } from "./utils";

export function RecommendationCard({
  recommendation,
}: {
  recommendation: FeedbackRecommendation;
}) {
  const material = getMaterialByTitle(recommendation.resourceTitle);

  return (
    <article className="rounded-3xl border bg-card/80 p-6 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-xl border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${priorityClasses(
            recommendation.priority,
          )}`}
        >
          {recommendation.priority}
        </span>
        <span
          className={`inline-flex rounded-xl border px-3 py-1 text-xs font-medium ${statusClasses(
            recommendation.status,
          )}`}
        >
          {formatStatus(recommendation.status)}
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-semibold tracking-tight">
        {recommendation.title}
      </h3>
      <p className="mt-3 text-sm leading-8 text-muted-foreground">
        {recommendation.description}
      </p>

      {material ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link
            href={`/materials/${material.slug}`}
            className="inline-flex items-center gap-2 text-cyan-300 transition-colors hover:text-cyan-200"
          >
            <BookOpen className="size-4" />
            {material.title}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
