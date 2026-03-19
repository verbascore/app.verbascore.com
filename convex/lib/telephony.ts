import { ConvexError } from "convex/values";

function base64UrlEncode(value: ArrayBuffer | string) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

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
  clientStatusCallbackUrl,
  clientPhoneNumber,
}: {
  outboundCallerId: string;
  clientStatusCallbackUrl: string;
  clientPhoneNumber: string;
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting your VerbaScore call.</Say>
  <Dial answerOnBridge="true" callerId="${escapeXml(outboundCallerId)}">
    <Number statusCallback="${escapeXml(
      clientStatusCallbackUrl,
    )}" statusCallbackEvent="initiated ringing answered completed" statusCallbackMethod="POST">${escapeXml(
    clientPhoneNumber,
  )}</Number>
  </Dial>
</Response>`;
}

export async function updateTwilioCall({
  accountSid,
  authToken,
  callSid,
  body,
}: {
  accountSid: string;
  authToken: string;
  callSid: string;
  body: URLSearchParams;
}) {
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`,
    {
      method: "POST",
      headers: {
        Authorization: buildTwilioBasicAuth(accountSid, authToken),
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ConvexError(`Twilio call update failed: ${errorText}`);
  }

  return await response.json();
}

export async function startTwilioRecording({
  accountSid,
  authToken,
  callSid,
  recordingStatusCallbackUrl,
}: {
  accountSid: string;
  authToken: string;
  callSid: string;
  recordingStatusCallbackUrl: string;
}) {
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}/Recordings.json`,
    {
      method: "POST",
      headers: {
        Authorization: buildTwilioBasicAuth(accountSid, authToken),
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        RecordingChannels: "dual",
        RecordingStatusCallback: recordingStatusCallbackUrl,
        RecordingStatusCallbackMethod: "POST",
        Track: "both",
      }).toString(),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ConvexError(`Twilio recording could not be started: ${errorText}`);
  }

  return (await response.json()) as { sid: string; status?: string };
}

export async function stopTwilioRecording({
  accountSid,
  authToken,
  callSid,
  recordingSid,
}: {
  accountSid: string;
  authToken: string;
  callSid: string;
  recordingSid: string;
}) {
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}/Recordings/${recordingSid}.json`,
    {
      method: "POST",
      headers: {
        Authorization: buildTwilioBasicAuth(accountSid, authToken),
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        Status: "stopped",
      }).toString(),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ConvexError(`Twilio recording could not be stopped: ${errorText}`);
  }

  return await response.json();
}

export function parseDurationSeconds(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  const durationSeconds = Number.parseInt(value, 10);
  return !Number.isNaN(durationSeconds) ? durationSeconds : undefined;
}

export async function createTwilioAccessToken({
  accountSid,
  apiKeySid,
  apiKeySecret,
  identity,
  twimlAppSid,
}: {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
  identity: string;
  twimlAppSid: string;
}) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = {
    alg: "HS256",
    typ: "JWT",
    cty: "twilio-fpa;v=1",
  };

  const payload = {
    jti: `${apiKeySid}-${issuedAt}`,
    iss: apiKeySid,
    sub: accountSid,
    exp: expiresAt,
    grants: {
      identity,
      voice: {
        incoming: {
          allow: false,
        },
        outgoing: {
          application_sid: twimlAppSid,
        },
      },
    },
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(apiKeySecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}
