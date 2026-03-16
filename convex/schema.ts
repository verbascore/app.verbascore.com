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
});
