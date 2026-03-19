"use client";

import { SellerDashboardView } from "./seller-dashboard-view";
import { HomeDashboardData } from "./types";

export function OwnerDashboardView(props: {
  data: HomeDashboardData | undefined;
}) {
  return <SellerDashboardView {...props} />;
}
