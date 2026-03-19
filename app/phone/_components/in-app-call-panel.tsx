"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PhoneCall } from "lucide-react";
import { useAction, useMutation } from "convex/react";

import type { CurrentSession } from "@/app/phone/_components/types";
import { formatStatus } from "@/app/phone/_components/utils";
import { api } from "@/convex/_generated/api";

type VoiceDeviceModule = typeof import("@twilio/voice-sdk");

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(durationSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function InAppCallPanel({
  currentSession,
}: {
  currentSession: CurrentSession;
}) {
  const createVoiceClientToken = useAction(api.telephony.createVoiceClientToken);
  const controlSession = useAction(api.telephony.controlSession);
  const reportBrowserCallState = useMutation(api.telephony.reportBrowserCallState);

  const deviceRef = useRef<InstanceType<VoiceDeviceModule["Device"]> | null>(null);
  const connectionRef = useRef<any>(null);
  const connectedAtRef = useRef<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [localStatus, setLocalStatus] = useState<string>("connecting");
  const [error, setError] = useState<string | null>(null);
  const durationSecondsRef = useRef(0);

  useEffect(() => {
    durationSecondsRef.current = durationSeconds;
  }, [durationSeconds]);

  useEffect(() => {
    let disposed = false;
    let interval: number | undefined;

    async function connect() {
      try {
        const { token } = await createVoiceClientToken({
          sessionId: currentSession._id as never,
        });
        const voiceSdk = (await import("@twilio/voice-sdk")) as VoiceDeviceModule;

        if (disposed) {
          return;
        }

        const device = new voiceSdk.Device(token, {
          logLevel: 1,
        });
        deviceRef.current = device;

        device.on("error", (deviceError) => {
          setError(deviceError.message);
          setLocalStatus("failed");
          void reportBrowserCallState({
            sessionId: currentSession._id as never,
            status: "failed",
            errorMessage: deviceError.message,
          });
        });

        device.on("registered", async () => {
          if (disposed) {
            return;
          }

          const connection = await device.connect({
            params: {
              sessionId: currentSession._id,
            },
          });

          connectionRef.current = connection;

          connection.on("ringing", () => {
            setLocalStatus("ringing");
            void reportBrowserCallState({
              sessionId: currentSession._id as never,
              status: "ringing",
            });
          });

          connection.on("accept", () => {
            connectedAtRef.current = Date.now();
            setLocalStatus("in_progress");
            const callSid =
              typeof connection.parameters?.CallSid === "string"
                ? connection.parameters.CallSid
                : undefined;
            void reportBrowserCallState({
              sessionId: currentSession._id as never,
              status: "in_progress",
              sellerCallSid: callSid,
            });
            interval = window.setInterval(() => {
              if (!connectedAtRef.current) {
                return;
              }

              setDurationSeconds(
                Math.floor((Date.now() - connectedAtRef.current) / 1000),
              );
            }, 1000);
          });

          connection.on("disconnect", () => {
            if (interval) {
              window.clearInterval(interval);
            }
            const duration = connectedAtRef.current
              ? Math.floor((Date.now() - connectedAtRef.current) / 1000)
              : durationSecondsRef.current;
            setLocalStatus("completed");
            void reportBrowserCallState({
              sessionId: currentSession._id as never,
              status: "completed",
              durationSeconds: duration,
            });
          });

          connection.on("cancel", () => {
            setLocalStatus("canceled");
            void reportBrowserCallState({
              sessionId: currentSession._id as never,
              status: "canceled",
            });
          });

          connection.on("reject", () => {
            setLocalStatus("no_answer");
            void reportBrowserCallState({
              sessionId: currentSession._id as never,
              status: "no_answer",
            });
          });
        });

        await device.register();
      } catch (connectError) {
        setError(
          connectError instanceof Error
            ? connectError.message
            : "Unable to start the in-app call.",
        );
        setLocalStatus("failed");
      }
    }

    void connect();

    return () => {
      disposed = true;
      if (interval) {
        window.clearInterval(interval);
      }
      connectionRef.current?.disconnect();
      deviceRef.current?.destroy();
    };
  }, [createVoiceClientToken, currentSession._id, reportBrowserCallState]);

  const resolvedStatus = useMemo(() => {
    if (currentSession.status === "in_progress" || localStatus === "in_progress") {
      return "in progress";
    }

    if (currentSession.status) {
      return formatStatus(currentSession.status);
    }

    return localStatus;
  }, [currentSession.status, localStatus]);

  async function handleHangup() {
    try {
      setIsBusy(true);
      connectionRef.current?.disconnect();
      await controlSession({
        sessionId: currentSession._id as never,
        action: "hangup",
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRecord() {
    try {
      setIsBusy(true);
      await controlSession({
        sessionId: currentSession._id as never,
        action:
          currentSession.recordingStatus === "in-progress"
            ? "stop_recording"
            : "start_recording",
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="w-full rounded-[2rem] border bg-neutral-950 p-5 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
            Call In App
          </p>
          <p className="mt-1 text-lg font-semibold">{currentSession.title}</p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium capitalize text-white/75">
          {resolvedStatus}
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
          {currentSession.description || "VerbaScore business line call"}
        </p>
        <p className="mt-3 text-center text-sm font-medium text-white/70">
          {formatDuration(durationSeconds)}
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        <button
          onClick={() => void handleRecord()}
          disabled={isBusy || localStatus !== "in_progress"}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {currentSession.recordingStatus === "in-progress"
            ? "Stop recording"
            : "Start recording"}
        </button>
        <button
          onClick={() => void handleHangup()}
          disabled={isBusy}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-rose-500 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hang up
        </button>
      </div>
    </div>
  );
}
