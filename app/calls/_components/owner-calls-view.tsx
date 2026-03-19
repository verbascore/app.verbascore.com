"use client";

import { SellerScopeSelector } from "@/components/seller-scope-selector";

import { CallsHero } from "./calls-hero";
import { CallsTable } from "./calls-table";
import { CallRowData } from "./types";

type SellerOption = {
  userId: string;
  name: string;
  email?: string;
};

export function OwnerCallsView({
  selectedSeller,
  onSelectedSellerChange,
  sellerOptions,
  error,
  calls,
  hasCalls,
  analysisCallId,
  deletingCallId,
  onStartAnalysis,
  onDeleteCall,
}: {
  selectedSeller: string;
  onSelectedSellerChange: (value: string) => void;
  sellerOptions: SellerOption[];
  error: string | null;
  calls: CallRowData[] | undefined;
  hasCalls: boolean;
  analysisCallId: string | null;
  deletingCallId: string | null;
  onStartAnalysis: (callId: string) => void;
  onDeleteCall: (callId: string, callTitle: string) => void;
}) {
  return (
    <>
      <div className="mb-6 flex justify-start">
        <SellerScopeSelector
          value={selectedSeller}
          onValueChange={onSelectedSellerChange}
          sellers={sellerOptions}
          averageLabel="Average across sellers"
        />
      </div>

      <CallsHero />

      {error ? (
        <section className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-sm">
          {error}
        </section>
      ) : null}

      <CallsTable
        calls={calls}
        hasCalls={hasCalls}
        analysisCallId={analysisCallId}
        deletingCallId={deletingCallId}
        onStartAnalysis={onStartAnalysis}
        onDeleteCall={onDeleteCall}
      />
    </>
  );
}
