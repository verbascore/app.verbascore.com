import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

async function requireIdentity(ctx: {
  auth: {
    getUserIdentity: () => Promise<{
      subject: string;
    } | null>;
  };
}) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("Unauthorized");
  }

  return identity;
}

function clampScore(score: number, label: string) {
  if (score < 0 || score > 100) {
    throw new ConvexError(`${label} must be between 0 and 100`);
  }
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createCall = mutation({
  args: {
    sellerAudioStorageId: v.id("_storage"),
    clientAudioStorageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();

    return await ctx.db.insert("calls", {
      ownerUserId: identity.subject,
      sellerAudioStorageId: args.sellerAudioStorageId,
      clientAudioStorageId: args.clientAudioStorageId,
      title: args.title,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listCalls = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_owner_updated_at", (q) =>
        q.eq("ownerUserId", identity.subject),
      )
      .order("desc")
      .collect();

    return await Promise.all(
      calls.map(async (call) => {
        const analysis = await ctx.db
          .query("callAnalyses")
          .withIndex("by_call", (q) => q.eq("callId", call._id))
          .first();
        const pendingAnalysis = await ctx.db
          .query("pending_analysis")
          .withIndex("by_call", (q) => q.eq("callId", call._id))
          .first();
        const sellerAudioUrl = await ctx.storage.getUrl(
          call.sellerAudioStorageId,
        );
        const clientAudioUrl = await ctx.storage.getUrl(
          call.clientAudioStorageId,
        );

        return {
          ...call,
          sellerAudioUrl,
          clientAudioUrl,
          analysis,
          pendingAnalysis,
        };
      }),
    );
  },
});

export const getCallDetails = query({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const call = await ctx.db.get(args.callId);

    if (!call || call.ownerUserId !== identity.subject) {
      return null;
    }

    const analysis = await ctx.db
      .query("callAnalyses")
      .withIndex("by_call", (q) => q.eq("callId", call._id))
      .first();
    const pendingAnalysis = await ctx.db
      .query("pending_analysis")
      .withIndex("by_call", (q) => q.eq("callId", call._id))
      .first();
    const transcriptEntries = analysis
      ? await ctx.db
          .query("callTranscriptEntries")
          .withIndex("by_analysis_start_time", (q) =>
            q.eq("callAnalysisId", analysis._id),
          )
          .collect()
      : [];

    return {
      ...call,
      sellerAudioUrl: await ctx.storage.getUrl(call.sellerAudioStorageId),
      clientAudioUrl: await ctx.storage.getUrl(call.clientAudioStorageId),
      analysis,
      pendingAnalysis,
      transcriptEntries,
    };
  },
});

export const startAnalysis = mutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const call = await ctx.db.get(args.callId);

    if (!call || call.ownerUserId !== identity.subject) {
      throw new ConvexError("Call not found");
    }

    const existingAnalysis = await ctx.db
      .query("callAnalyses")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (existingAnalysis) {
      throw new ConvexError("Analysis already exists for this call");
    }

    const existingPending = await ctx.db
      .query("pending_analysis")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (existingPending && existingPending.status !== "failed") {
      return existingPending._id;
    }

    const now = Date.now();
    const pendingAnalysisId = existingPending
      ? existingPending._id
      : await ctx.db.insert("pending_analysis", {
          callId: call._id,
          ownerUserId: identity.subject,
          status: "queued",
          progress: 0,
          currentStep: "Queued for analysis",
          createdAt: now,
          updatedAt: now,
        });

    if (existingPending) {
      await ctx.db.patch(existingPending._id, {
        status: "queued",
        progress: 0,
        currentStep: "Queued for analysis",
        errorMessage: undefined,
        updatedAt: now,
      });
    }

    await ctx.scheduler.runAfter(0, internal.callAnalysis.processCallAnalysis, {
      callId: call._id,
      pendingAnalysisId,
      ownerUserId: identity.subject,
    });

    return pendingAnalysisId;
  },
});

export const deleteCall = mutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const call = await ctx.db.get(args.callId);

    if (!call || call.ownerUserId !== identity.subject) {
      throw new ConvexError("Call not found");
    }

    const pendingAnalysis = await ctx.db
      .query("pending_analysis")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (
      pendingAnalysis &&
      (pendingAnalysis.status === "queued" ||
        pendingAnalysis.status === "processing")
    ) {
      throw new ConvexError(
        "You can't delete a call while analysis is running",
      );
    }

    const analysis = await ctx.db
      .query("callAnalyses")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    if (analysis) {
      const transcriptEntries = await ctx.db
        .query("callTranscriptEntries")
        .withIndex("by_analysis", (q) => q.eq("callAnalysisId", analysis._id))
        .collect();

      await Promise.all(
        transcriptEntries.map((entry) => ctx.db.delete(entry._id)),
      );
      await ctx.db.delete(analysis._id);
    }

    if (pendingAnalysis) {
      await ctx.db.delete(pendingAnalysis._id);
    }

    await Promise.all([
      ctx.storage.delete(call.sellerAudioStorageId),
      ctx.storage.delete(call.clientAudioStorageId),
    ]);

    await ctx.db.delete(call._id);
  },
});

export const getCallForProcessing = internalQuery({
  args: {
    callId: v.id("calls"),
    ownerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);

    if (!call || call.ownerUserId !== args.ownerUserId) {
      throw new ConvexError("Call not found");
    }

    return {
      ...call,
      sellerAudioUrl: await ctx.storage.getUrl(call.sellerAudioStorageId),
      clientAudioUrl: await ctx.storage.getUrl(call.clientAudioStorageId),
    };
  },
});

export const updatePendingAnalysis = internalMutation({
  args: {
    pendingAnalysisId: v.id("pending_analysis"),
    status: v.optional(
      v.union(
        v.literal("queued"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    progress: v.optional(v.number()),
    currentStep: v.optional(v.string()),
    errorMessage: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.pendingAnalysisId);

    if (!existing) {
      throw new ConvexError("Pending analysis not found");
    }

    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) patch.status = args.status;
    if (args.progress !== undefined) patch.progress = args.progress;
    if (args.currentStep !== undefined) patch.currentStep = args.currentStep;
    if (args.errorMessage !== undefined) {
      patch.errorMessage = args.errorMessage ?? undefined;
    }

    await ctx.db.patch(args.pendingAnalysisId, patch);
  },
});

export const completeAnalysis = internalMutation({
  args: {
    pendingAnalysisId: v.id("pending_analysis"),
    callId: v.id("calls"),
    aiSummary: v.string(),
    quickness: v.number(),
    introduction: v.number(),
    knowledge: v.number(),
    hospitality: v.number(),
    callToAction: v.number(),
    overallRating: v.number(),
    transcriptEntries: v.array(
      v.object({
        channel: v.union(v.literal("seller"), v.literal("client")),
        text: v.string(),
        startTimestampMs: v.number(),
        endTimestampMs: v.optional(v.number()),
        rating: v.number(),
        isObjection: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    clampScore(args.quickness, "quickness");
    clampScore(args.introduction, "introduction");
    clampScore(args.knowledge, "knowledge");
    clampScore(args.hospitality, "hospitality");
    clampScore(args.callToAction, "callToAction");
    clampScore(args.overallRating, "overallRating");

    const now = Date.now();
    const existingAnalysis = await ctx.db
      .query("callAnalyses")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .first();

    let callAnalysisId = existingAnalysis?._id;

    if (existingAnalysis) {
      await ctx.db.patch(existingAnalysis._id, {
        aiSummary: args.aiSummary,
        quickness: args.quickness,
        introduction: args.introduction,
        knowledge: args.knowledge,
        hospitality: args.hospitality,
        callToAction: args.callToAction,
        overallRating: args.overallRating,
        updatedAt: now,
      });

      const existingEntries = await ctx.db
        .query("callTranscriptEntries")
        .withIndex("by_analysis", (q) =>
          q.eq("callAnalysisId", existingAnalysis._id),
        )
        .collect();

      await Promise.all(
        existingEntries.map((entry) => ctx.db.delete(entry._id)),
      );
    } else {
      callAnalysisId = await ctx.db.insert("callAnalyses", {
        callId: args.callId,
        aiSummary: args.aiSummary,
        quickness: args.quickness,
        introduction: args.introduction,
        knowledge: args.knowledge,
        hospitality: args.hospitality,
        callToAction: args.callToAction,
        overallRating: args.overallRating,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (!callAnalysisId) {
      throw new ConvexError("Unable to create call analysis");
    }

    for (const entry of args.transcriptEntries) {
      clampScore(entry.rating, "transcript entry rating");
      await ctx.db.insert("callTranscriptEntries", {
        callAnalysisId,
        channel: entry.channel,
        text: entry.text,
        startTimestampMs: entry.startTimestampMs,
        endTimestampMs: entry.endTimestampMs,
        rating: entry.rating,
        isObjection: entry.isObjection,
      });
    }

    await ctx.db.patch(args.callId, {
      updatedAt: now,
    });

    await ctx.db.patch(args.pendingAnalysisId, {
      status: "completed",
      progress: 100,
      currentStep: "Analysis completed",
      errorMessage: undefined,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.analytics.generateSnapshot, {
      callId: args.callId,
    });
    await ctx.scheduler.runAfter(0, internal.feedback.generateSnapshot, {
      callId: args.callId,
    });

    return callAnalysisId;
  },
});
