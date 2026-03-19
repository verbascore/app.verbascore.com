"use client";

import { useRef, useState, type FormEvent } from "react";
import { useAction, useQuery } from "convex/react";

import { CurrentSessionPanel } from "@/app/phone/_components/current-session-panel";
import { DeviceHandoffCard } from "@/app/phone/_components/device-handoff-card";
import { StartSessionForm } from "@/app/phone/_components/start-session-form";
import type { CurrentSession } from "@/app/phone/_components/types";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";
import { api } from "@/convex/_generated/api";

function openPhoneWindow() {
  return window.open(
    "/phone/window",
    "verbascore-phone-window",
    "popup=yes,width=420,height=780,resizable=yes,scrollbars=no",
  );
}

export default function PhonePage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const currentSession = useQuery(
    api.telephony.getCurrentSellerSession,
    workspace?.team && workspace?.membership?.role === "seller" ? {} : "skip",
  ) as CurrentSession | null | undefined;
  const startOutboundCall = useAction(api.telephony.startOutboundCall);
  const startInAppCallSession = useAction(api.telephony.startInAppCallSession);
  const controlSession = useAction(api.telephony.controlSession);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientPhoneNumber, setClientPhoneNumber] = useState("");
  const [callMode, setCallMode] = useState<"call_my_phone" | "call_in_app">(
    "call_my_phone",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTakingControl, setIsTakingControl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  async function handleStartSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const popupWindow = openPhoneWindow();
    popupRef.current = popupWindow;

    try {
      setIsSubmitting(true);
      setError(null);
      if (callMode === "call_in_app") {
        const result = await startInAppCallSession({
          title: title.trim(),
          description: description.trim(),
          clientPhoneNumber: clientPhoneNumber.trim(),
        });
        popupWindow!.location.href = `/phone/window?mode=call_in_app&sessionId=${String(
          result.sessionId,
        )}`;
      } else {
        await startOutboundCall({
          title: title.trim(),
          description: description.trim(),
          clientPhoneNumber: clientPhoneNumber.trim(),
          platformOrigin: "web",
        });
      }
      setTitle("");
      setDescription("");
      setClientPhoneNumber("");
    } catch (sessionError) {
      popupWindow?.close();
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "Unable to start the phone session.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTakeControlOnWeb() {
    if (!currentSession) {
      return;
    }

    try {
      setIsTakingControl(true);
      setError(null);
      await controlSession({
        sessionId: currentSession._id as never,
        action: "take_web",
      });
      popupRef.current = openPhoneWindow();
    } catch (takeoverError) {
      setError(
        takeoverError instanceof Error
          ? takeoverError.message
          : "Unable to take control on web.",
      );
    } finally {
      setIsTakingControl(false);
    }
  }

  if (!workspace) {
    return (
      <AppShell activeHref="/phone" title="Phone">
        <section className="mt-6 rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Loading workspace...
        </section>
      </AppShell>
    );
  }

  if (!workspace.team || !workspace.membership) {
    return <TeamEmptyState />;
  }

  if (workspace.membership.role !== "seller") {
    return (
      <AppShell
        activeHref="/team"
        title="Phone"
        workspaceTitle={workspace.team.title}
        workspaceRole={workspace.membership.role}
      >
        <section className="rounded-3xl border bg-card/80 p-6 text-sm text-muted-foreground shadow-sm">
          Phone sessions are only available to seller accounts.
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeHref="/phone"
      title="Phone"
      workspaceTitle={workspace.team.title}
      workspaceRole={workspace.membership.role}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <section className="rounded-3xl border bg-card/90 p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Seller Phone
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {currentSession ? "Current session" : "Start a session"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Handle the active call on web or move it back to mobile, similar to
              device handoff in Teams.
            </p>
          </div>

          <div className="mt-6">
            {currentSession ? (
              <CurrentSessionPanel
                currentSession={currentSession}
                onOpenPhoneWindow={() => {
                  const popupWindow = popupRef.current;

                  if (!popupWindow || popupWindow.closed) {
                    popupRef.current = openPhoneWindow();
                    return;
                  }

                  popupWindow.focus();
                }}
                onTakeControlOnWeb={() => void handleTakeControlOnWeb()}
                takingControl={isTakingControl}
              />
            ) : (
              <StartSessionForm
                title={title}
                description={description}
                clientPhoneNumber={clientPhoneNumber}
                callMode={callMode}
                onCallModeChange={setCallMode}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onClientPhoneNumberChange={setClientPhoneNumber}
                onSubmit={(event) => void handleStartSession(event)}
                isSubmitting={isSubmitting}
                sellerPhoneNumber={workspace.profile?.phoneNumber}
                error={error}
              />
            )}
          </div>
        </section>

        <DeviceHandoffCard />
      </div>
    </AppShell>
  );
}
