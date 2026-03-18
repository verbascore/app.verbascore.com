"use client";

import { BarChart3, User2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SellerOption = {
  userId: string;
  name: string;
  email?: string;
};

export function SellerScopeSelector({
  label = "View",
  value,
  onValueChange,
  sellers,
  averageLabel = "Average",
}: {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  sellers: SellerOption[];
  averageLabel?: string;
}) {
  const selectedSeller = sellers.find((seller) => seller.userId === value);
  const description =
    value === "average"
      ? "Team-wide average across all sellers"
      : selectedSeller?.email || "Seller-specific performance";

  return (
    <section className="w-full max-w-sm rounded-2xl border bg-card/90 p-3 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold tracking-tight">
            {value === "average" ? averageLabel : selectedSeller?.name || "Seller"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex size-9 items-center justify-center rounded-xl border bg-background/70 text-muted-foreground">
          {value === "average" ? (
            <BarChart3 className="size-4" />
          ) : (
            <User2 className="size-4" />
          )}
        </div>
      </div>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          size="default"
          className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
        >
          <SelectValue placeholder="Select scope" />
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-xl">
          <SelectItem value="average">{averageLabel}</SelectItem>
          {sellers.map((seller) => (
            <SelectItem key={seller.userId} value={seller.userId}>
              {seller.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </section>
  );
}
