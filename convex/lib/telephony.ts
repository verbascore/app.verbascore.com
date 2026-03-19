import { ConvexError } from "convex/values";

export function requireEnvVar(value: string | undefined, label: string) {
  if (!value) {
    throw new ConvexError(`${label} is not configured.`);
  }

  return value;
}

export function mapTwilioStatus(status: string | null | undefined) {
  switch (status) {
    case "queued":
    case "initiated":
      return "initiated" as const;
    case "ringing":
      return "ringing" as const;
    case "in-progress":
      return "in_progress" as const;
    case "completed":
      return "completed" as const;
    case "busy":
      return "busy" as const;
    case "no-answer":
      return "no_answer" as const;
    case "failed":
      return "failed" as const;
    case "canceled":
      return "canceled" as const;
    default:
      return "initiated" as const;
  }
}

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildTwilioBasicAuth(accountSid: string, authToken: string) {
  return `Basic ${btoa(`${accountSid}:${authToken}`)}`;
}

export async function createTwilioCall({
  accountSid,
  authToken,
  to,
  from,
  twimlUrl,
  statusCallbackUrl,
}: {
  accountSid: string;
  authToken: string;
  to: string;
  from: string;
  twimlUrl: string;
  statusCallbackUrl: string;
}) {
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: buildTwilioBasicAuth(accountSid, authToken),
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Url: twimlUrl,
        Method: "POST",
        StatusCallback: statusCallbackUrl,
        StatusCallbackMethod: "POST",
        StatusCallbackEvent: "initiated ringing answered completed",
        Record: "true",
      }).toString(),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new ConvexError(`Twilio call could not be started: ${body}`);
  }

  return (await response.json()) as { sid: string };
}

export function buildOutboundTwiml({
  outboundCallerId,
  recordingCallbackUrl,
  clientStatusCallbackUrl,
  clientPhoneNumber,
}: {
  outboundCallerId: string;
  recordingCallbackUrl: string;
  clientStatusCallbackUrl: string;
  clientPhoneNumber: string;
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting your VerbaScore call.</Say>
  <Dial answerOnBridge="true" callerId="${escapeXml(
    outboundCallerId,
  )}" record="record-from-answer-dual" recordingStatusCallback="${escapeXml(
    recordingCallbackUrl,
  )}" recordingStatusCallbackMethod="POST">
    <Number statusCallback="${escapeXml(
      clientStatusCallbackUrl,
    )}" statusCallbackEvent="initiated ringing answered completed" statusCallbackMethod="POST">${escapeXml(
    clientPhoneNumber,
  )}</Number>
  </Dial>
</Response>`;
}

export function parseDurationSeconds(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  const durationSeconds = Number.parseInt(value, 10);
  return !Number.isNaN(durationSeconds) ? durationSeconds : undefined;
}
