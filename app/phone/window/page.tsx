"use client";

import { useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";

import { InAppCallPanel } from "@/app/phone/_components/in-app-call-panel";
import { WebPhonePopup } from "@/app/phone/_components/web-phone-popup";
import type { CurrentSession } from "@/app/phone/_components/types";
import { api } from "@/convex/_generated/api";

export default function PhoneWindowPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const currentSession = useQuery(
    api.telephony.getCurrentSellerSession,
    workspace?.team && workspace?.membership?.role === "seller" ? {} : "skip",
  ) as CurrentSession | null | undefined;
  const controlSession = useAction(api.telephony.controlSession);

  async function runControl(
    action:
      | "hangup"
      | "start_recording"
      | "stop_recording",
  ) {
    if (!currentSession) {
      return;
    }

    await controlSession({
      sessionId: currentSession._id as never,
      action,
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,246,0.16),_transparent_24%),linear-gradient(180deg,_#05080c,_#0a0f14)] p-5 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[380px] items-center">
        {!workspace ? (
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-white/65">
            Loading call window...
          </div>
        ) : !workspace.team || !workspace.membership ? (
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-white/65">
            No active workspace found for this account.
          </div>
        ) : !currentSession || currentSession.handledBy !== "web" ? (
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-white/65">
            No active web-handled call session right now.
          </div>
        ) : mode === "call_in_app" || currentSession.callMode === "call_in_app" ? (
          <InAppCallPanel currentSession={currentSession} />
        ) : (
          <WebPhonePopup
            currentSession={currentSession}
            onHangup={() => void runControl("hangup")}
            onStartRecording={() => void runControl("start_recording")}
            onStopRecording={() => void runControl("stop_recording")}
          />
        )}
      </div>
    </main>
  );
}
