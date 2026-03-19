"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { MonitorSmartphone, PhoneCall, Smartphone } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { TeamEmptyState } from "@/components/team-empty-state";

type CurrentSession = {
  _id: string;
  title: string;
  description?: string;
  sellerPhoneNumber: string;
  clientPhoneNumber: string;
  status: string;
  handledBy: "web" | "mobile";
  handlerLabel?: string;
  platformOrigin: "ios" | "android" | "web";
  durationSeconds?: number;
  updatedAt: number;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

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
              <div className="rounded-3xl border bg-background/80 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Active now
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      {currentSession.title}
                    </h3>
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

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => void handleSwitchDevice("web")}
                    disabled={isSwitching || currentSession.handledBy === "web"}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MonitorSmartphone className="size-4" />
                    Handle on web
                  </button>
                  <button
                    onClick={() => void handleSwitchDevice("mobile")}
                    disabled={isSwitching || currentSession.handledBy === "mobile"}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Smartphone className="size-4" />
                    Move to mobile
                  </button>
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  Currently handled by{" "}
                  <span className="font-medium text-foreground">
                    {currentSession.handlerLabel ?? currentSession.handledBy}
                  </span>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleStartSession} className="space-y-4">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Call title"
                  className="h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none ring-0 transition focus:border-primary"
                />
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Call description"
                  className="min-h-28 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
                />
                <input
                  value={clientPhoneNumber}
                  onChange={(event) => setClientPhoneNumber(event.target.value)}
                  placeholder="Client phone number"
                  className="h-12 w-full rounded-2xl border bg-background px-4 text-sm outline-none ring-0 transition focus:border-primary"
                />
                {!workspace.profile?.phoneNumber ? (
                  <p className="text-sm text-amber-600">
                    Save your seller phone number first from Account in the mobile
                    app or team profile.
                  </p>
                ) : null}
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !title.trim() ||
                    !description.trim() ||
                    !clientPhoneNumber.trim() ||
                    !workspace.profile?.phoneNumber
                  }
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PhoneCall className="size-4" />
                  {isSubmitting ? "Starting..." : "Start session"}
                </button>
              </form>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border bg-card/90 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Session policy
          </p>
          <h3 className="mt-2 text-lg font-semibold">Device handoff</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>Only one active seller session can be handled at a time.</li>
            <li>Web and mobile can both see the same session state in real time.</li>
            <li>Switching the handler moves the active control surface without creating a new call.</li>
          </ul>
        </aside>
      </div>

      {showWebPhonePopup && currentSession ? (
        <div className="fixed right-6 bottom-6 z-50 w-[360px] rounded-[2rem] border bg-neutral-950 p-5 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
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
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => void handleSwitchDevice("mobile")}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-white/10 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Send to mobile
            </button>
            <button
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              aria-label="Active call"
            >
              <PhoneCall className="size-5" />
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
