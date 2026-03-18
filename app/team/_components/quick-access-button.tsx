"use client";

import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuickAccessButton({
  icon,
  title,
  description,
  destructive = false,
  disabled = false,
  className,
  ...props
}: {
  icon: ReactNode;
  title: string;
  description: string;
  destructive?: boolean;
  disabled?: boolean;
} & React.ComponentProps<"button">) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={disabled}
      {...props}
      className={cn(
        "flex h-auto min-h-28 w-full flex-col items-start justify-between rounded-2xl px-4 py-4 text-left whitespace-normal",
        destructive && "border-destructive/40 hover:bg-muted/40",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-2xl",
          destructive ? "bg-destructive/10" : "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        <div className="mt-1 text-xs leading-6 text-muted-foreground">
          {description}
        </div>
      </div>
    </Button>
  );
}
