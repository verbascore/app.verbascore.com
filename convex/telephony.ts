import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";

import { api, internal } from "./_generated/api";
import {
  action,
  httpAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { assertRole, requireTeamMembership } from "./lib/teamAccess";

function requireEnvVar(value: string | undefined, label: string) {
  if (!value) {
    throw new ConvexError(`${label} is not configured.`);
  }

  return value;
}

function mapTwilioStatus(status: string | null | undefined) {
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

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireTeamMembership(ctx);

    return await ctx.db
      .query("phoneCallSessions")
      .withIndex("by_team_updated_at", (q) => q.eq("teamId", membership.teamId))
      .order("desc")
      .collect();
  },
});

export const getCurrentSellerSession = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireTeamMembership(ctx);
    assertRole(membership, ["seller"]);

    const sessions = await ctx.db
      .query("phoneCallSessions")
      .withIndex("by_owner_updated_at", (q) =>
        q.eq("ownerUserId", membership.userId),
      )
      .order("desc")
      .collect();

    return (
      sessions.find((session) =>
        ["draft", "initiated", "ringing", "in_progress"].includes(session.status),
      ) ?? null
    );
  },
});

export const startOutboundCall = action({
  args: {
    title: v.string(),
    description: v.string(),
    clientPhoneNumber: v.string(),
    platformOrigin: v.union(
      v.literal("ios"),
      v.literal("android"),
      v.literal("web"),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    sessionId: Id<"phoneCallSessions">;
    sellerCallSid: string;
    sellerPhoneNumber: string;
    clientPhoneNumber: string;
    status: "initiated";
  }> => {
    const workspace = await ctx.runQuery(api.teams.getCurrentWorkspace, {});

    if (!workspace.team || !workspace.membership) {
      throw new ConvexError("You need an active team before starting a phone call.");
    }

    assertRole(workspace.membership, ["seller"]);

    const title = args.title.trim();
    const description = args.description.trim();
    const clientPhoneNumber = args.clientPhoneNumber.trim();
    const sellerPhoneNumber =
      workspace.profile?.phoneNumber?.trim() ??
      process.env.TWILIO_SELLER_PHONE_NUMBER?.trim() ??
      "";

    if (!title) {
      throw new ConvexError("Call title is required.");
    }

    if (!description) {
      throw new ConvexError("Call description is required.");
    }

    if (!clientPhoneNumber) {
      throw new ConvexError("Client phone number is required.");
    }

    if (!sellerPhoneNumber) {
      throw new ConvexError(
        "Save your seller phone number in the app account screen before starting a Twilio call.",
      );
    }

    const accountSid = requireEnvVar(
      process.env.TWILIO_ACCOUNT_SID,
      "TWILIO_ACCOUNT_SID",
    );
    const authToken = requireEnvVar(
      process.env.TWILIO_AUTH_TOKEN,
      "TWILIO_AUTH_TOKEN",
    );
    const outboundCallerId = requireEnvVar(
      process.env.TWILIO_CALLER_ID,
      "TWILIO_CALLER_ID",
    );
    const convexSiteUrl = requireEnvVar(
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? process.env.CONVEX_SITE_URL,
      "CONVEX_SITE_URL",
    );

    const sessionId = (await ctx.runMutation(internal.telephony.createSession, {
      teamId: workspace.team._id,
      ownerUserId: workspace.membership.userId,
      title,
      description,
      sellerPhoneNumber,
      clientPhoneNumber,
      platformOrigin: args.platformOrigin,
      handledBy: args.platformOrigin === "web" ? "web" : "mobile",
      handlerLabel: args.platformOrigin === "web" ? "Web" : "Mobile",
    })) as Id<"phoneCallSessions">;

    const baseUrl = convexSiteUrl.replace(/\/$/, "");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({
          To: sellerPhoneNumber,
          From: outboundCallerId,
          Url: `${baseUrl}/twilio/outbound/twiml?sessionId=${sessionId}`,
          Method: "POST",
          StatusCallback: `${baseUrl}/twilio/outbound/status?sessionId=${sessionId}&leg=seller`,
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

    const twilioCall = (await response.json()) as { sid: string };

    await ctx.runMutation(internal.telephony.attachSellerCallSid, {
      sessionId,
      sellerCallSid: twilioCall.sid,
      status: "initiated",
    });

    return {
      sessionId,
      sellerCallSid: twilioCall.sid,
      sellerPhoneNumber,
      clientPhoneNumber,
      status: "initiated" as const,
    };
  },
});

export const createSession = internalMutation({
  args: {
    teamId: v.id("teams"),
    ownerUserId: v.string(),
    title: v.string(),
    description: v.string(),
    sellerPhoneNumber: v.string(),
    clientPhoneNumber: v.string(),
    platformOrigin: v.union(
      v.literal("ios"),
      v.literal("android"),
      v.literal("web"),
    ),
    handledBy: v.union(v.literal("web"), v.literal("mobile")),
    handlerLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("phoneCallSessions", {
      teamId: args.teamId,
      ownerUserId: args.ownerUserId,
      source: "twilio",
      platformOrigin: args.platformOrigin,
      handledBy: args.handledBy,
      handlerLabel: args.handlerLabel,
      handlerUpdatedAt: now,
      title: args.title,
      description: args.description,
      sellerPhoneNumber: args.sellerPhoneNumber,
      clientPhoneNumber: args.clientPhoneNumber,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setSessionHandler = mutation({
  args: {
    sessionId: v.id("phoneCallSessions"),
    handledBy: v.union(v.literal("web"), v.literal("mobile")),
    handlerLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireTeamMembership(ctx);
    assertRole(membership, ["seller"]);
    const session = await ctx.db.get(args.sessionId);

    if (!session || session.teamId !== membership.teamId) {
      throw new ConvexError("Session not found.");
    }

    if (session.ownerUserId !== membership.userId) {
      throw new ConvexError("You do not have permission to control this session.");
    }

    await ctx.db.patch(args.sessionId, {
      handledBy: args.handledBy,
      handlerLabel: args.handlerLabel,
      handlerUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const attachSellerCallSid = internalMutation({
  args: {
    sessionId: v.id("phoneCallSessions"),
    sellerCallSid: v.string(),
    status: v.union(
      v.literal("initiated"),
      v.literal("ringing"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("busy"),
      v.literal("failed"),
      v.literal("no_answer"),
      v.literal("canceled"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      sellerCallSid: args.sellerCallSid,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const getSessionForWebhook = internalQuery({
  args: {
    sessionId: v.id("phoneCallSessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const applyStatusWebhook = internalMutation({
  args: {
    sessionId: v.id("phoneCallSessions"),
    leg: v.union(v.literal("seller"), v.literal("client")),
    callSid: v.optional(v.string()),
    callStatus: v.string(),
    durationSeconds: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      return;
    }

    const now = Date.now();
    const nextStatus = mapTwilioStatus(args.callStatus);
    await ctx.db.patch(args.sessionId, {
      status: nextStatus,
      sellerCallSid:
        args.leg === "seller" ? args.callSid ?? session.sellerCallSid : session.sellerCallSid,
      clientCallSid:
        args.leg === "client" ? args.callSid ?? session.clientCallSid : session.clientCallSid,
      durationSeconds: args.durationSeconds ?? session.durationSeconds,
      errorMessage: args.errorMessage ?? session.errorMessage,
      answeredAt:
        nextStatus === "in_progress" && !session.answeredAt ? now : session.answeredAt,
      endedAt:
        nextStatus === "completed" ||
        nextStatus === "busy" ||
        nextStatus === "failed" ||
        nextStatus === "no_answer" ||
        nextStatus === "canceled"
          ? now
          : session.endedAt,
      updatedAt: now,
    });
  },
});

export const applyRecordingWebhook = internalMutation({
  args: {
    sessionId: v.id("phoneCallSessions"),
    recordingSid: v.string(),
    recordingUrl: v.string(),
    recordingStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      return;
    }

    await ctx.db.patch(args.sessionId, {
      recordingSid: args.recordingSid,
      recordingUrl: args.recordingUrl,
      recordingStatus: args.recordingStatus,
      updatedAt: Date.now(),
    });
  },
});

export const outboundTwiml = httpAction(async (ctx, req) => {
  const requestUrl = new URL(req.url);
  const sessionId = requestUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("Missing sessionId", { status: 400 });
  }

  const session = await ctx.runQuery(internal.telephony.getSessionForWebhook, {
    sessionId: sessionId as never,
  });

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const convexSiteUrl = requireEnvVar(
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? process.env.CONVEX_SITE_URL,
    "CONVEX_SITE_URL",
  ).replace(/\/$/, "");
  const outboundCallerId = requireEnvVar(
    process.env.TWILIO_CALLER_ID,
    "TWILIO_CALLER_ID",
  );

  const voiceResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting your VerbaScore call.</Say>
  <Dial answerOnBridge="true" callerId="${escapeXml(
    outboundCallerId,
  )}" record="record-from-answer-dual" recordingStatusCallback="${escapeXml(
    `${convexSiteUrl}/twilio/outbound/recording?sessionId=${session._id}`,
  )}" recordingStatusCallbackMethod="POST">
    <Number statusCallback="${escapeXml(
      `${convexSiteUrl}/twilio/outbound/status?sessionId=${session._id}&leg=client`,
    )}" statusCallbackEvent="initiated ringing answered completed" statusCallbackMethod="POST">${escapeXml(
    session.clientPhoneNumber,
  )}</Number>
  </Dial>
</Response>`;

  return new Response(voiceResponse, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
});

export const outboundStatus = httpAction(async (ctx, req) => {
  const requestUrl = new URL(req.url);
  const sessionId = requestUrl.searchParams.get("sessionId");
  const leg = requestUrl.searchParams.get("leg");

  if (!sessionId || (leg !== "seller" && leg !== "client")) {
    return new Response("Missing parameters", { status: 400 });
  }

  const formData = await req.formData();
  const durationValue = formData.get("CallDuration");
  const durationSeconds =
    typeof durationValue === "string" && durationValue
      ? Number.parseInt(durationValue, 10)
      : undefined;

  await ctx.runMutation(internal.telephony.applyStatusWebhook, {
    sessionId: sessionId as never,
    leg,
    callSid:
      typeof formData.get("CallSid") === "string"
        ? (formData.get("CallSid") as string)
        : undefined,
    callStatus:
      typeof formData.get("CallStatus") === "string"
        ? (formData.get("CallStatus") as string)
        : "initiated",
    durationSeconds:
      typeof durationSeconds === "number" && !Number.isNaN(durationSeconds)
        ? durationSeconds
        : undefined,
    errorMessage:
      typeof formData.get("ErrorMessage") === "string"
        ? (formData.get("ErrorMessage") as string)
        : undefined,
  });

  return new Response("ok", { status: 200 });
});

export const outboundRecording = httpAction(async (ctx, req) => {
  const requestUrl = new URL(req.url);
  const sessionId = requestUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("Missing sessionId", { status: 400 });
  }

  const formData = await req.formData();
  const recordingSid = formData.get("RecordingSid");
  const recordingUrl = formData.get("RecordingUrl");
  const recordingStatus = formData.get("RecordingStatus");

  if (
    typeof recordingSid !== "string" ||
    typeof recordingUrl !== "string" ||
    typeof recordingStatus !== "string"
  ) {
    return new Response("Missing recording parameters", { status: 400 });
  }

  await ctx.runMutation(internal.telephony.applyRecordingWebhook, {
    sessionId: sessionId as never,
    recordingSid,
    recordingUrl,
    recordingStatus,
  });

  return new Response("ok", { status: 200 });
});
