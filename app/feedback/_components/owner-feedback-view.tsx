"use client";

import { SellerScopeSelector } from "@/components/seller-scope-selector";

import { OwnerFeedbackEmptyState } from "./owner-feedback-empty-state";
import { SellerFeedbackView } from "./seller-feedback-view";
import { FeedbackDashboardSlice, SellerOption } from "./types";

export function OwnerFeedbackView({
  data,
  selectedIndex,
  onSelectIndex,
  selectedSeller,
  onSelectedSellerChange,
  sellerOptions,
}: {
  data: FeedbackDashboardSlice | null;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  selectedSeller: string;
  onSelectedSellerChange: (value: string) => void;
  sellerOptions: SellerOption[];
}) {
  return (
    <>
      <div className="mb-6 flex justify-start">
        <SellerScopeSelector
          label="Seller"
          value={selectedSeller}
          onValueChange={onSelectedSellerChange}
          sellers={sellerOptions}
          averageLabel="Average across sellers"
        />
      </div>
      <SellerFeedbackView
        data={data}
        selectedIndex={selectedIndex}
        onSelectIndex={onSelectIndex}
        emptyState={
          <OwnerFeedbackEmptyState selectedSeller={selectedSeller} />
        }
      />
    </>
  );
}
