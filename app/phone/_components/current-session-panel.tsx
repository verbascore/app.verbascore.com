"use client";

import type { CurrentSession } from "@/app/phone/_components/types";
import { formatStatus } from "@/app/phone/_components/utils";

export function CurrentSessionPanel({
  currentSession,
  onOpenPhoneWindow,
  onTakeControlOnWeb,
  takingControl,
}: {
  currentSession: CurrentSession;
  onOpenPhoneWindow?: () => void;
  onTakeControlOnWeb?: () => void;
  takingControl?: boolean;
}) {
  return (
    <div className="rounded-3xl border bg-background/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Active now
          </p>
          <h3 className="mt-2 text-xl font-semibold">{currentSession.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentSession.description || "No description provided."}
          </p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
          {formatStatus(currentSession.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card/60 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Seller
          </p>
          <p className="mt-2 text-sm font-medium">
            {currentSession.sellerPhoneNumber}
          </p>
        </div>
        <div className="rounded-2xl border bg-card/60 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Client
          </p>
          <p className="mt-2 text-sm font-medium">
            {currentSession.clientPhoneNumber}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Currently handled by{" "}
        <span className="font-medium text-foreground">
          {currentSession.handlerLabel ?? currentSession.handledBy}
        </span>
        .
      </p>

      {currentSession.handledBy === "web" && onOpenPhoneWindow ? (
        <div className="mt-5">
          <button
            onClick={onOpenPhoneWindow}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            Open call window
          </button>
        </div>
      ) : currentSession.handledBy === "mobile" && onTakeControlOnWeb ? (
        <div className="mt-5">
          <button
            onClick={onTakeControlOnWeb}
            disabled={takingControl}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {takingControl ? "Taking control..." : "Take control on web"}
          </button>
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Use the mobile app to move this session between phone and web.
        </p>
      )}
    </div>
  );
}
