"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAction, useMutation, useQuery } from "convex/react";

import { CurrentSessionPanel } from "@/app/phone/_components/current-session-panel";
import { DeviceHandoffCard } from "@/app/phone/_components/device-handoff-card";
import { StartSessionForm } from "@/app/phone/_components/start-session-form";
import type { CurrentSession } from "@/app/phone/_components/types";
import { WebPhonePopup } from "@/app/phone/_components/web-phone-popup";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";
import { api } from "@/convex/_generated/api";

export default function PhonePage() {
  const workspace = useQuery(api.teams.getCurrentWorkspace);
  const currentSession = useQuery(
    api.telephony.getCurrentSellerSession,
    workspace?.team && workspace?.membership?.role === "seller" ? {} : "skip",
  ) as CurrentSession | null | undefined;
  const startOutboundCall = useAction(api.telephony.startOutboundCall);
  const setSessionHandler = useMutation(api.telephony.setSessionHandler);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientPhoneNumber, setClientPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showWebPhonePopup = useMemo(
    () =>
      Boolean(
        currentSession &&
          ["draft", "initiated", "ringing", "in_progress"].includes(
            currentSession.status,
          ) &&
          currentSession.handledBy === "web",
      ),
    [currentSession],
  );

  async function handleStartSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      await startOutboundCall({
        title: title.trim(),
        description: description.trim(),
        clientPhoneNumber: clientPhoneNumber.trim(),
        platformOrigin: "web",
      });
      setTitle("");
      setDescription("");
      setClientPhoneNumber("");
    } catch (sessionError) {
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "Unable to start the phone session.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSwitchDevice(handledBy: "web" | "mobile") {
    if (!currentSession) {
      return;
    }

    try {
      setIsSwitching(true);
      setError(null);
      await setSessionHandler({
        sessionId: currentSession._id as never,
        handledBy,
        handlerLabel: handledBy === "web" ? "Web" : "Mobile",
      });
    } catch (switchError) {
      setError(
        switchError instanceof Error
          ? switchError.message
          : "Unable to switch the session device.",
      );
    } finally {
      setIsSwitching(false);
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
                isSwitching={isSwitching}
                onSwitchDevice={(handledBy) => void handleSwitchDevice(handledBy)}
              />
            ) : (
              <StartSessionForm
                title={title}
                description={description}
                clientPhoneNumber={clientPhoneNumber}
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

      {showWebPhonePopup && currentSession ? (
        <WebPhonePopup
          currentSession={currentSession}
          onSendToMobile={() => void handleSwitchDevice("mobile")}
        />
      ) : null}
    </AppShell>
  );
}
