import { CallRowData, CallStatus } from "./types";

export function uploadFile(uploadUrl: string, file: File) {
  return fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const result = (await response.json()) as { storageId: string };
    return result.storageId;
  });
}

export function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export function getCallStatus(call: CallRowData): CallStatus {
  if (call.analysis) {
    return {
      label: "Analyzed",
      variant: "default",
    };
  }

  if (call.pendingAnalysis?.status === "failed") {
    return {
      label: "Failed",
      variant: "destructive",
    };
  }

  if (
    call.pendingAnalysis?.status === "queued" ||
    call.pendingAnalysis?.status === "processing"
  ) {
    return {
      label: "Processing",
      variant: "secondary",
    };
  }

  return {
    label: "Ready",
    variant: "outline",
  };
}
