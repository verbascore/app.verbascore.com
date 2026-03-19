import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

import { api, internal } from "./_generated/api";
import {
  action,
  httpAction,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import {
  buildOutboundTwiml,
  createTwilioAccessToken,
  createTwilioCall,
  mapTwilioStatus,
  parseDurationSeconds,
  requireEnvVar,
  startTwilioRecording,
  stopTwilioRecording,
  updateTwilioCall,
} from "./lib/telephony";
import { assertRole, requireTeamMembership } from "./lib/teamAccess";

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
    const sellerPhoneNumber = workspace.profile?.phoneNumber?.trim() ?? "";

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
        "This seller needs an owner-assigned phone number before a Twilio call can start.",
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

    if (sellerPhoneNumber === outboundCallerId) {
      throw new ConvexError(
        "The seller phone number cannot be the same as the Twilio caller ID. Assign the seller's real mobile number from Team.",
      );
    }

    const sessionId = (await ctx.runMutation(internal.telephony.createSession, {
      teamId: workspace.team._id,
      ownerUserId: workspace.membership.userId,
      title,
      description,
      sellerPhoneNumber,
      clientPhoneNumber,
      callMode: "call_my_phone",
      platformOrigin: args.platformOrigin,
      handledBy: args.platformOrigin === "web" ? "web" : "mobile",
      handlerLabel: args.platformOrigin === "web" ? "Web" : "Mobile",
    })) as Id<"phoneCallSessions">;

    const baseUrl = convexSiteUrl.replace(/\/$/, "");
    const twilioCall = await createTwilioCall({
      accountSid,
      authToken,
      to: sellerPhoneNumber,
      from: outboundCallerId,
      twimlUrl: `${baseUrl}/twilio/outbound/twiml?sessionId=${sessionId}`,
      statusCallbackUrl: `${baseUrl}/twilio/outbound/status?sessionId=${sessionId}&leg=seller`,
    });

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
    callMode: v.optional(
      v.union(v.literal("call_my_phone"), v.literal("call_in_app")),
    ),
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
      callMode: args.callMode,
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

export const startInAppCallSession = action({
  args: {
    title: v.string(),
    description: v.string(),
    clientPhoneNumber: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ sessionId: Id<"phoneCallSessions"> }> => {
    const workspace = await ctx.runQuery(api.teams.getCurrentWorkspace, {});

    if (!workspace.team || !workspace.membership) {
      throw new ConvexError("You need an active team before starting a phone call.");
    }

    assertRole(workspace.membership, ["seller"]);

    const title = args.title.trim();
    const description = args.description.trim();
    const clientPhoneNumber = args.clientPhoneNumber.trim();
    const sellerPhoneNumber = requireEnvVar(
      process.env.TWILIO_CALLER_ID,
      "TWILIO_CALLER_ID",
    );

    if (!title) {
      throw new ConvexError("Call title is required.");
    }

    if (!description) {
      throw new ConvexError("Call description is required.");
    }

    if (!clientPhoneNumber) {
      throw new ConvexError("Client phone number is required.");
    }

    const sessionId = (await ctx.runMutation(internal.telephony.createSession, {
      teamId: workspace.team._id,
      ownerUserId: workspace.membership.userId,
      title,
      description,
      sellerPhoneNumber,
      clientPhoneNumber,
      callMode: "call_in_app",
      platformOrigin: "web",
      handledBy: "web",
      handlerLabel: "Web",
    })) as Id<"phoneCallSessions">;

    return { sessionId };
  },
});

export const createVoiceClientToken = action({
  args: {
    sessionId: v.id("phoneCallSessions"),
  },
  handler: async (ctx, args): Promise<{ token: string; identity: string }> => {
    const workspace = await ctx.runQuery(api.teams.getCurrentWorkspace, {});

    if (!workspace.team || !workspace.membership) {
      throw new ConvexError("You need an active team before starting a phone call.");
    }

    assertRole(workspace.membership, ["seller"]);

    const session = (await ctx.runQuery(internal.telephony.getSessionForWebhook, {
      sessionId: args.sessionId,
    })) as Doc<"phoneCallSessions"> | null;

    if (!session || session.teamId !== workspace.team._id) {
      throw new ConvexError("Session not found.");
    }

    if (session.ownerUserId !== workspace.membership.userId) {
      throw new ConvexError("You do not have permission to use this session.");
    }

    if (session.callMode !== "call_in_app") {
      throw new ConvexError("This session is not configured for Call In App.");
    }

    const token = await createTwilioAccessToken({
      accountSid: requireEnvVar(process.env.TWILIO_ACCOUNT_SID, "TWILIO_ACCOUNT_SID"),
      apiKeySid: requireEnvVar(process.env.TWILIO_API_KEY_SID, "TWILIO_API_KEY_SID"),
      apiKeySecret: requireEnvVar(
        process.env.TWILIO_API_KEY_SECRET,
        "TWILIO_API_KEY_SECRET",
      ),
      identity: `seller:${workspace.membership.userId}`,
      twimlAppSid: requireEnvVar(
        process.env.TWILIO_TWIML_APP_SID,
        "TWILIO_TWIML_APP_SID",
      ),
    });

    return {
      token,
      identity: `seller:${workspace.membership.userId}`,
    };
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

export const controlSession = action({
  args: {
    sessionId: v.id("phoneCallSessions"),
    action: v.union(
      v.literal("take_web"),
      v.literal("take_mobile"),
      v.literal("hangup"),
      v.literal("start_recording"),
      v.literal("stop_recording"),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: true; recordingSid?: string | undefined }> => {
    const workspace = await ctx.runQuery(api.teams.getCurrentWorkspace, {});

    if (!workspace.team || !workspace.membership) {
      throw new ConvexError("You need an active team before controlling a call.");
    }

    assertRole(workspace.membership, ["seller"]);

    const session = (await ctx.runQuery(internal.telephony.getSessionForWebhook, {
      sessionId: args.sessionId,
    })) as Doc<"phoneCallSessions"> | null;

    if (!session || session.teamId !== workspace.team._id) {
      throw new ConvexError("Session not found.");
    }

    if (session.ownerUserId !== workspace.membership.userId) {
      throw new ConvexError("You do not have permission to control this session.");
    }

    if (args.action === "take_web" || args.action === "take_mobile") {
      await ctx.runMutation(internal.telephony.patchSessionControlState, {
        sessionId: session._id,
        handledBy: args.action === "take_web" ? "web" : "mobile",
        handlerLabel: args.action === "take_web" ? "Web" : "Mobile",
      });
      return { ok: true };
    }

    const accountSid = requireEnvVar(
      process.env.TWILIO_ACCOUNT_SID,
      "TWILIO_ACCOUNT_SID",
    );
    const authToken = requireEnvVar(
      process.env.TWILIO_AUTH_TOKEN,
      "TWILIO_AUTH_TOKEN",
    );
    const convexSiteUrl = requireEnvVar(
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? process.env.CONVEX_SITE_URL,
      "CONVEX_SITE_URL",
    ).replace(/\/$/, "");

    if (!session.sellerCallSid) {
      throw new ConvexError("The live seller call SID is missing for this session.");
    }

    if (args.action === "hangup") {
      await updateTwilioCall({
        accountSid,
        authToken,
        callSid: session.sellerCallSid,
        body: new URLSearchParams({
          Status: "completed",
        }),
      });
      return { ok: true };
    }

    if (args.action === "start_recording") {
      if (session.status !== "in_progress") {
        throw new ConvexError("Recording can only start after the call is connected.");
      }

      if (session.recordingStatus === "in-progress") {
        return { ok: true, recordingSid: session.recordingSid };
      }

      const started = await startTwilioRecording({
        accountSid,
        authToken,
        callSid: session.sellerCallSid,
        recordingStatusCallbackUrl: `${convexSiteUrl}/twilio/outbound/recording?sessionId=${session._id}`,
      });

      await ctx.runMutation(internal.telephony.applyRecordingWebhook, {
        sessionId: session._id,
        recordingSid: started.sid,
        recordingUrl: session.recordingUrl ?? "",
        recordingStatus: started.status ?? "in-progress",
        consented: true,
        startedAt: Date.now(),
      });

      return { ok: true, recordingSid: started.sid };
    }

    if (!session.recordingSid) {
      throw new ConvexError("There is no active recording to stop.");
    }

    await stopTwilioRecording({
      accountSid,
      authToken,
      callSid: session.sellerCallSid,
      recordingSid: session.recordingSid,
    });

    await ctx.runMutation(internal.telephony.applyRecordingWebhook, {
      sessionId: session._id,
      recordingSid: session.recordingSid,
      recordingUrl: session.recordingUrl ?? "",
      recordingStatus: "stopped",
      endedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const patchSessionControlState = internalMutation({
  args: {
    sessionId: v.id("phoneCallSessions"),
    handledBy: v.union(v.literal("web"), v.literal("mobile")),
    handlerLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      handledBy: args.handledBy,
      handlerLabel: args.handlerLabel,
      handlerUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reportBrowserCallState = mutation({
  args: {
    sessionId: v.id("phoneCallSessions"),
    status: v.union(
      v.literal("ringing"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("no_answer"),
      v.literal("canceled"),
    ),
    sellerCallSid: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
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

    const now = Date.now();
    await ctx.db.patch(args.sessionId, {
      status: args.status,
      sellerCallSid: args.sellerCallSid ?? session.sellerCallSid,
      durationSeconds: args.durationSeconds ?? session.durationSeconds,
      errorMessage: args.errorMessage ?? session.errorMessage,
      answeredAt:
        args.status === "in_progress" && !session.answeredAt
          ? now
          : session.answeredAt,
      endedAt:
        args.status === "completed" ||
        args.status === "failed" ||
        args.status === "no_answer" ||
        args.status === "canceled"
          ? now
          : session.endedAt,
      updatedAt: now,
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
    consented: v.optional(v.boolean()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      return;
    }

    await ctx.db.patch(args.sessionId, {
      recordingSid: args.recordingSid,
      recordingUrl: args.recordingUrl || session.recordingUrl,
      recordingStatus: args.recordingStatus,
      recordingConsentAt:
        args.consented && !session.recordingConsentAt
          ? Date.now()
          : session.recordingConsentAt,
      recordingStartedAt: args.startedAt ?? session.recordingStartedAt,
      recordingEndedAt: args.endedAt ?? session.recordingEndedAt,
      updatedAt: Date.now(),
    });
  },
});

export const archiveRecordingToCall = internalAction({
  args: {
    sessionId: v.id("phoneCallSessions"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<Id<"calls"> | null> => {
    const session = (await ctx.runQuery(internal.telephony.getSessionForWebhook, {
      sessionId: args.sessionId,
    })) as Doc<"phoneCallSessions"> | null;

    if (
      !session ||
      !session.recordingUrl ||
      !session.recordingSid ||
      session.archivedCallId
    ) {
      return null;
    }

    const accountSid = requireEnvVar(
      process.env.TWILIO_ACCOUNT_SID,
      "TWILIO_ACCOUNT_SID",
    );
    const authToken = requireEnvVar(
      process.env.TWILIO_AUTH_TOKEN,
      "TWILIO_AUTH_TOKEN",
    );

    const response = await fetch(`${session.recordingUrl}.mp3`, {
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
    });

    if (!response.ok) {
      throw new ConvexError("Twilio recording could not be downloaded.");
    }

    const recordingBlob = await response.blob();
    const sellerAudioStorageId = await ctx.storage.store(recordingBlob);
    const clientAudioStorageId = await ctx.storage.store(recordingBlob);

    const callId = (await ctx.runMutation(internal.telephony.createArchivedCall, {
      teamId: session.teamId,
      ownerUserId: session.ownerUserId,
      sellerAudioStorageId,
      clientAudioStorageId,
      title: session.title,
      description: session.description
        ? `${session.description}\n\nRecorded via Twilio after explicit consent.`
        : "Recorded via Twilio after explicit consent.",
    })) as Id<"calls">;

    await ctx.runMutation(internal.telephony.attachArchivedRecording, {
      sessionId: session._id,
      archivedCallId: callId,
      recordingStorageId: sellerAudioStorageId,
    });

    return callId;
  },
});

export const createArchivedCall = internalMutation({
  args: {
    teamId: v.id("teams"),
    ownerUserId: v.string(),
    sellerAudioStorageId: v.id("_storage"),
    clientAudioStorageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("calls", {
      teamId: args.teamId,
      ownerUserId: args.ownerUserId,
      sellerAudioStorageId: args.sellerAudioStorageId,
      clientAudioStorageId: args.clientAudioStorageId,
      title: args.title,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const attachArchivedRecording = internalMutation({
  args: {
    sessionId: v.id("phoneCallSessions"),
    archivedCallId: v.id("calls"),
    recordingStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      archivedCallId: args.archivedCallId,
      recordingStorageId: args.recordingStorageId,
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

  const voiceResponse = buildOutboundTwiml({
    outboundCallerId,
    clientStatusCallbackUrl: `${convexSiteUrl}/twilio/outbound/status?sessionId=${session._id}&leg=client`,
    clientPhoneNumber: session.clientPhoneNumber,
  });

  return new Response(voiceResponse, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
});

export const clientOutboundTwiml = httpAction(async (ctx, req) => {
  const formData = await req.formData();
  const sessionId = formData.get("sessionId");

  if (typeof sessionId !== "string" || !sessionId) {
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

  const voiceResponse = buildOutboundTwiml({
    outboundCallerId,
    clientStatusCallbackUrl: `${convexSiteUrl}/twilio/outbound/status?sessionId=${session._id}&leg=client`,
    clientPhoneNumber: session.clientPhoneNumber,
  });

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
  const durationSeconds = parseDurationSeconds(formData.get("CallDuration"));

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

  if (recordingStatus === "completed") {
    await ctx.runAction(internal.telephony.archiveRecordingToCall, {
      sessionId: sessionId as never,
    });
  }

  return new Response("ok", { status: 200 });
});
