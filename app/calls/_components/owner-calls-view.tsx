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
  totalCalls,
  analyzedCalls,
  averageScore,
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
  totalCalls: number;
  analyzedCalls: number;
  averageScore: number | null;
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
      <section className="rounded-3xl border bg-card/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Review each seller&apos;s call library, or switch to the team
              average.
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Seller Performance Scope
            </h2>
          </div>
          <SellerScopeSelector
            value={selectedSeller}
            onValueChange={onSelectedSellerChange}
            sellers={sellerOptions}
            averageLabel="Average across sellers"
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Calls
            </p>
            <p className="mt-2 text-2xl font-semibold">{totalCalls}</p>
          </div>
          <div className="rounded-2xl border px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Analyzed
            </p>
            <p className="mt-2 text-2xl font-semibold">{analyzedCalls}</p>
          </div>
          <div className="rounded-2xl border px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Average Score
            </p>
            <p className="mt-2 text-2xl font-semibold">{averageScore ?? "—"}</p>
          </div>
        </div>
      </section>

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
