import { materialsCatalog } from "@/lib/materials";

import { MaterialCard } from "./material-card";

export function RecommendedMaterials({
  recommendedTitles,
}: {
  recommendedTitles: string[];
}) {
  const recommended = materialsCatalog.filter((material) =>
    recommendedTitles.includes(material.title),
  );

  const fallback = materialsCatalog.slice(0, 4);
  const items = recommended.length > 0 ? recommended : fallback;

  return (
    <section className="mt-10">
      <p className="text-2xl font-semibold tracking-tight">
        Recommended for You
      </p>
      <div className="mt-6 grid gap-6 xl:grid-cols-4">
        {items.map((material) => (
          <MaterialCard key={material.slug} material={material} compact />
        ))}
      </div>
    </section>
  );
}
