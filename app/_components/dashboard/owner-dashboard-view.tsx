"use client";

import { SellerDashboardView } from "./seller-dashboard-view";
import { HomeDashboardData } from "./types";

export function OwnerDashboardView(props: {
  data: HomeDashboardData | undefined;
  teamTitle: string;
  teamDescription: string;
  memberCount: number;
}) {
  return <SellerDashboardView {...props} role="owner" />;
}
