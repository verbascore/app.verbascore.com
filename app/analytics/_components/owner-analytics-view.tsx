"use client";

import { SellerScopeSelector } from "@/components/seller-scope-selector";

import { SellerAnalyticsView } from "./seller-analytics-view";
import {
  AnalyticsDashboardSlice,
  MetricKey,
  SellerOption,
} from "./types";

export function OwnerAnalyticsView({
  data,
  selectedMetric,
  onMetricChange,
  selectedIndex,
  onSelectIndex,
  selectedSeller,
  onSelectedSellerChange,
  sellerOptions,
}: {
  data: AnalyticsDashboardSlice | null;
  selectedMetric: MetricKey;
  onMetricChange: (metric: MetricKey) => void;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  selectedSeller: string;
  onSelectedSellerChange: (value: string) => void;
  sellerOptions: SellerOption[];
}) {
  return (
    <SellerAnalyticsView
      data={data}
      selectedMetric={selectedMetric}
      onMetricChange={onMetricChange}
      selectedIndex={selectedIndex}
      onSelectIndex={onSelectIndex}
      scopeControl={
        <SellerScopeSelector
          label="Seller"
          value={selectedSeller}
          onValueChange={onSelectedSellerChange}
          sellers={sellerOptions}
          averageLabel="Average across sellers"
        />
      }
    />
  );
}
