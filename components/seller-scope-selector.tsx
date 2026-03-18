"use client";

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
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="h-11 min-w-[220px] rounded-xl border bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
      >
        <option value="average">{averageLabel}</option>
        {sellers.map((seller) => (
          <option key={seller.userId} value={seller.userId}>
            {seller.name}
            {seller.email ? ` (${seller.email})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
