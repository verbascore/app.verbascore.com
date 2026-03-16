import { Material, MaterialType } from "@/lib/materials";

export type MaterialFilter = "all" | MaterialType;

export type MaterialsDashboardData = {
  recommendedMaterials: string[];
};

export type MaterialCardProps = {
  material: Material;
  compact?: boolean;
};
