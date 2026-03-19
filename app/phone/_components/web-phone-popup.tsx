"use client";

import { PhoneCall } from "lucide-react";

import type { CurrentSession } from "@/app/phone/_components/types";
import { formatStatus } from "@/app/phone/_components/utils";

function formatDuration(durationSeconds?: number) {
  if (!durationSeconds || durationSeconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(durationSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(durationSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function WebPhonePopup({
  currentSession,
  onHangup,
  onStartRecording,
  onStopRecording,
  busy,
}: {
  currentSession: CurrentSession;
  onHangup?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  busy?: boolean;
}) {
  return (
    <div className="w-full rounded-[2rem] border bg-neutral-950 p-5 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
            Phone
          </p>
          <p className="mt-1 text-lg font-semibold">{currentSession.title}</p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium capitalize text-white/75">
          {formatStatus(currentSession.status)}
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] bg-white/[0.06] p-5">
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/90 to-cyan-300/70 text-neutral-950">
          <PhoneCall className="size-8" />
        </div>
        <p className="mt-4 text-center text-xl font-semibold">
          {currentSession.clientPhoneNumber}
        </p>
        <p className="mt-1 text-center text-sm text-white/55">
          {currentSession.description || "VerbaScore outbound session"}
        </p>
        <p className="mt-3 text-center text-sm font-medium text-white/70">
          {formatDuration(currentSession.durationSeconds)}
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <button
          onClick={
            currentSession.recordingStatus === "in-progress"
              ? onStopRecording
              : onStartRecording
          }
          disabled={busy}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {currentSession.recordingStatus === "in-progress"
            ? "Stop recording"
            : "Start recording"}
        </button>
        <button
          onClick={onHangup}
          disabled={busy}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-rose-500 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hang up
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
          <PhoneCall className="size-5" />
        </div>
      </div>
    </div>
  );
}
