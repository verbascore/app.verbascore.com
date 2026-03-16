import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  calls: defineTable({
    ownerUserId: v.string(),
    sellerAudioStorageId: v.id("_storage"),
    clientAudioStorageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_user", ["ownerUserId"])
    .index("by_owner_updated_at", ["ownerUserId", "updatedAt"]),

  callAnalyses: defineTable({
    callId: v.id("calls"),
    aiSummary: v.string(),
    quickness: v.number(),
    introduction: v.number(),
    knowledge: v.number(),
    hospitality: v.number(),
    callToAction: v.number(),
    overallRating: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_call", ["callId"]),

  pending_analysis: defineTable({
    callId: v.id("calls"),
    ownerUserId: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    progress: v.number(),
    currentStep: v.string(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_call", ["callId"])
    .index("by_owner_user", ["ownerUserId"])
    .index("by_owner_status", ["ownerUserId", "status"]),

  callTranscriptEntries: defineTable({
    callAnalysisId: v.id("callAnalyses"),
    channel: v.union(v.literal("seller"), v.literal("client")),
    text: v.string(),
    startTimestampMs: v.number(),
    endTimestampMs: v.optional(v.number()),
    rating: v.number(),
    isObjection: v.boolean(),
  })
    .index("by_analysis", ["callAnalysisId"])
    .index("by_analysis_start_time", ["callAnalysisId", "startTimestampMs"]),

  analytics: defineTable({
    ownerUserId: v.string(),
    latestCallId: v.id("calls"),
    latestCallTitle: v.string(),
    sourceCallIds: v.array(v.id("calls")),
    sourceCallTitles: v.array(v.string()),
    trendPoints: v.array(
      v.object({
        label: v.string(),
        createdAt: v.number(),
        callId: v.id("calls"),
        callTitle: v.string(),
        overallRating: v.number(),
        closeRate: v.number(),
        quickness: v.number(),
        introduction: v.number(),
        knowledge: v.number(),
        hospitality: v.number(),
        callToAction: v.number(),
      }),
    ),
    currentMetrics: v.object({
      overallRating: v.number(),
      closeRate: v.number(),
      quickness: v.number(),
      introduction: v.number(),
      knowledge: v.number(),
      hospitality: v.number(),
      callToAction: v.number(),
    }),
    metricDeltas: v.object({
      overallRating: v.number(),
      closeRate: v.number(),
      quickness: v.number(),
      introduction: v.number(),
      knowledge: v.number(),
      hospitality: v.number(),
      callToAction: v.number(),
    }),
    topObjections: v.array(
      v.object({
        label: v.string(),
        count: v.number(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_created_at", ["ownerUserId", "createdAt"])
    .index("by_owner_updated_at", ["ownerUserId", "updatedAt"]),

  feedback: defineTable({
    ownerUserId: v.string(),
    latestCallId: v.id("calls"),
    latestCallTitle: v.string(),
    sourceCallIds: v.array(v.id("calls")),
    sourceCallTitles: v.array(v.string()),
    focusItems: v.array(v.string()),
    recommendations: v.array(
      v.object({
        priority: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low"),
        ),
        status: v.union(
          v.literal("new"),
          v.literal("in_progress"),
          v.literal("watch"),
        ),
        title: v.string(),
        description: v.string(),
        linkedCallIds: v.array(v.id("calls")),
        linkedCallTitles: v.array(v.string()),
        resourceTitle: v.string(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_created_at", ["ownerUserId", "createdAt"])
    .index("by_owner_updated_at", ["ownerUserId", "updatedAt"]),

  notifications: defineTable({
    ownerUserId: v.string(),
    level: v.union(
      v.literal("critical"),
      v.literal("warning"),
      v.literal("info"),
    ),
    title: v.string(),
    message: v.string(),
    href: v.optional(v.string()),
    sourceType: v.union(
      v.literal("call_analysis"),
      v.literal("analytics"),
      v.literal("feedback"),
    ),
    sourceCallId: v.optional(v.id("calls")),
    isBookmarked: v.boolean(),
    snoozedUntil: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_created_at", ["ownerUserId", "createdAt"])
    .index("by_owner_level", ["ownerUserId", "level"]),
});
