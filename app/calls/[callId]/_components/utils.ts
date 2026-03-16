import { TranscriptEntry } from "./types";

export function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export function formatClockDuration(totalMs: number) {
  const totalSeconds = Math.max(0, Math.round(totalMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatTimestamp(totalMs: number) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getTranscriptDuration(transcriptEntries: TranscriptEntry[]) {
  if (transcriptEntries.length === 0) {
    return null;
  }

  return transcriptEntries.reduce((latest, entry) => {
    return Math.max(
      latest,
      entry.endTimestampMs ?? entry.startTimestampMs,
      entry.startTimestampMs,
    );
  }, 0);
}

export function getSpeakerLabel(channel: "seller" | "client") {
  return channel === "seller" ? "Sales Rep" : "Customer";
}

export function getSpeakerInitials(channel: "seller" | "client") {
  return channel === "seller" ? "SR" : "CU";
}
