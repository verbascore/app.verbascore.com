import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { TranscriptionStatementSchema } from "./lib/transcriber/types";

export default defineSchema({
  userProfiles: defineTable({
    userId: v.string(),
    activeTeamId: v.optional(v.id("teams")),
    phoneNumber: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  teams: defineTable({
    title: v.string(),
    description: v.string(),
    inviteCode: v.optional(v.string()),
    createdByUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_created_by", ["createdByUserId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("seller")),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_team", ["teamId"])
    .index("by_user_team", ["userId", "teamId"])
    .index("by_team_user", ["teamId", "userId"]),

  teamInvitations: defineTable({
    teamId: v.id("teams"),
    email: v.string(),
    token: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked"),
    ),
    createdByUserId: v.string(),
    acceptedByUserId: v.optional(v.string()),
    acceptedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_team", ["teamId"])
    .index("by_team_status", ["teamId", "status"])
    .index("by_email", ["email"]),

  calls: defineTable({
    teamId: v.id("teams"),
    ownerUserId: v.string(),
    sellerAudioStorageId: v.id("_storage"),
    clientAudioStorageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_updated_at", ["teamId", "updatedAt"])
    .index("by_owner_user", ["ownerUserId"]),

  phoneCallSessions: defineTable({
    teamId: v.id("teams"),
    ownerUserId: v.string(),
    source: v.literal("twilio"),
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
    handlerUpdatedAt: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    sellerPhoneNumber: v.string(),
    clientPhoneNumber: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("initiated"),
      v.literal("ringing"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("busy"),
      v.literal("failed"),
      v.literal("no_answer"),
      v.literal("canceled"),
    ),
    sellerCallSid: v.optional(v.string()),
    clientCallSid: v.optional(v.string()),
    recordingSid: v.optional(v.string()),
    recordingUrl: v.optional(v.string()),
    recordingStatus: v.optional(v.string()),
    recordingStorageId: v.optional(v.id("_storage")),
    archivedCallId: v.optional(v.id("calls")),
    recordingConsentAt: v.optional(v.number()),
    recordingStartedAt: v.optional(v.number()),
    recordingEndedAt: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    answeredAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team_updated_at", ["teamId", "updatedAt"])
    .index("by_owner_updated_at", ["ownerUserId", "updatedAt"])
    .index("by_seller_call_sid", ["sellerCallSid"])
    .index("by_client_call_sid", ["clientCallSid"]),

  crmOrganizations: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    notes: v.optional(v.string()),
    lifecycleStage: v.union(
      v.literal("lead"),
      v.literal("prospect"),
      v.literal("customer"),
      v.literal("former_customer"),
    ),
    ownerUserId: v.optional(v.string()),
    externalSource: v.optional(v.string()),
    externalId: v.optional(v.string()),
    createdByUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team_updated_at", ["teamId", "updatedAt"])
    .index("by_team_lifecycle", ["teamId", "lifecycleStage"])
    .index("by_team_external", ["teamId", "externalSource"]),

  crmContacts: defineTable({
    teamId: v.id("teams"),
    organizationId: v.optional(v.id("crmOrganizations")),
    fullName: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    email: v.optional(v.string()),
    normalizedEmail: v.optional(v.string()),
    phoneNumber: v.string(),
    normalizedPhoneNumber: v.string(),
    alternatePhoneNumber: v.optional(v.string()),
    lifecycleStage: v.union(
      v.literal("lead"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("customer"),
      v.literal("inactive"),
    ),
    source: v.union(
      v.literal("manual"),
      v.literal("call"),
      v.literal("import"),
      v.literal("integration"),
    ),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
    assignedUserId: v.optional(v.string()),
    createdByUserId: v.string(),
    lastContactedAt: v.optional(v.number()),
    externalSource: v.optional(v.string()),
    externalId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team_updated_at", ["teamId", "updatedAt"])
    .index("by_team_phone", ["teamId", "normalizedPhoneNumber"])
    .index("by_team_email", ["teamId", "normalizedEmail"])
    .index("by_team_lifecycle", ["teamId", "lifecycleStage"])
    .index("by_team_organization", ["teamId", "organizationId"])
    .index("by_team_external", ["teamId", "externalSource"]),

  crmActivities: defineTable({
    teamId: v.id("teams"),
    contactId: v.optional(v.id("crmContacts")),
    organizationId: v.optional(v.id("crmOrganizations")),
    kind: v.union(
      v.literal("note"),
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("sync"),
    ),
    summary: v.string(),
    details: v.optional(v.string()),
    createdByUserId: v.string(),
    externalSource: v.optional(v.string()),
    externalId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team_created_at", ["teamId", "createdAt"])
    .index("by_contact_created_at", ["contactId", "createdAt"])
    .index("by_organization_created_at", ["organizationId", "createdAt"]),

  crmSyncConnections: defineTable({
    teamId: v.id("teams"),
    provider: v.string(),
    displayName: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("needs_attention"),
      v.literal("disabled"),
    ),
    externalAccountId: v.optional(v.string()),
    scopes: v.array(v.string()),
    metadataJson: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
    createdByUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team_updated_at", ["teamId", "updatedAt"])
    .index("by_team_provider", ["teamId", "provider"]),

  callAnalyses: defineTable({
    teamId: v.id("teams"),
    ownerUserId: v.string(),
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
  })
    .index("by_call", ["callId"])
    .index("by_team_created_at", ["teamId", "createdAt"]),

  pending_analysis: defineTable({
    teamId: v.id("teams"),
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
    sellerTranscriptRaw: v.optional(
      v.array(v.object(TranscriptionStatementSchema)),
    ),
    clientTranscriptRaw: v.optional(
      v.array(v.object(TranscriptionStatementSchema)),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_call", ["callId"])
    .index("by_team", ["teamId"])
    .index("by_team_status", ["teamId", "status"])
    .index("by_owner_user", ["ownerUserId"])
    .index("by_owner_status", ["ownerUserId", "status"]),

  callTranscriptEntries: defineTable({
    teamId: v.id("teams"),
    ownerUserId: v.string(),
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
    teamId: v.id("teams"),
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
    .index("by_team_created_at", ["teamId", "createdAt"])
    .index("by_team_updated_at", ["teamId", "updatedAt"])
    .index("by_owner_created_at", ["ownerUserId", "createdAt"])
    .index("by_owner_updated_at", ["ownerUserId", "updatedAt"]),

  feedback: defineTable({
    teamId: v.id("teams"),
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
    .index("by_team_created_at", ["teamId", "createdAt"])
    .index("by_team_updated_at", ["teamId", "updatedAt"])
    .index("by_owner_created_at", ["ownerUserId", "createdAt"])
    .index("by_owner_updated_at", ["ownerUserId", "updatedAt"]),

  notifications: defineTable({
    teamId: v.id("teams"),
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
    .index("by_team_created_at", ["teamId", "createdAt"])
    .index("by_team_level", ["teamId", "level"])
    .index("by_owner_created_at", ["ownerUserId", "createdAt"])
    .index("by_owner_level", ["ownerUserId", "level"]),
});
