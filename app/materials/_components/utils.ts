import { MaterialFilter } from "./types";

import { Material, MaterialType, materialTypeMeta } from "@/lib/materials";

export function matchesFilter(material: Material, filter: MaterialFilter) {
  return filter === "all" ? true : material.type === filter;
}

export function typeLabel(type: MaterialType) {
  return materialTypeMeta[type].shortLabel;
}
