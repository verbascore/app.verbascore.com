import { ConvexError, v } from "convex/values";

import { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, query } from "./_generated/server";
import { requireTeamMembership } from "./lib/teamAccess";

function buildLabel(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
  }).format(timestamp);
}

function normalizeObjectionLabel(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeObjectionLabel(text: string) {
  const sentence = text.split(/[.!?]/)[0]?.trim() || text.trim();
  return sentence.length > 48 ? `${sentence.slice(0, 45)}...` : sentence;
}

function calculateCloseRate(args: {
  overallRating: number;
  callToAction: number;
  hospitality: number;
}) {
  return Math.round(
    (args.overallRating * 0.5 +
      args.callToAction * 0.3 +
      args.hospitality * 0.2) *
      0.6,
  );
}

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireTeamMembership(ctx);

    const snapshots = await ctx.db
      .query("analytics")
      .withIndex("by_team_created_at", (q) =>
        q.eq("teamId", membership.teamId),
      )
      .order("desc")
      .collect();

    const pendingAnalyses = await ctx.db
      .query("pending_analysis")
      .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
      .collect();

    const activePendingAnalysis = pendingAnalyses
      .filter(
        (entry) => entry.status === "queued" || entry.status === "processing",
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];

    return {
      snapshots,
      activePendingAnalysis: activePendingAnalysis
        ? {
            callId: activePendingAnalysis.callId,
            status: activePendingAnalysis.status,
            progress: activePendingAnalysis.progress,
            currentStep: activePendingAnalysis.currentStep,
            updatedAt: activePendingAnalysis.updatedAt,
          }
        : null,
    };
  },
});

export const generateSnapshot = internalMutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const latestCall = await ctx.db.get(args.callId);

    if (!latestCall) {
      throw new ConvexError("Call not found");
    }

    const ownerUserId = latestCall.ownerUserId;
    const teamId = latestCall.teamId;
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_team_updated_at", (q) => q.eq("teamId", teamId))
      .order("desc")
      .collect();

    const analyzedCalls: Array<{
      call: Doc<"calls">;
      analysis: Doc<"callAnalyses">;
      transcriptEntries: Array<{
        text: string;
        isObjection: boolean;
      }>;
    }> = [];

    for (const call of calls) {
      const analysis = await ctx.db
        .query("callAnalyses")
        .withIndex("by_call", (q) => q.eq("callId", call._id))
        .first();

      if (!analysis) {
        continue;
      }

      const transcriptEntries = await ctx.db
        .query("callTranscriptEntries")
        .withIndex("by_analysis", (q) => q.eq("callAnalysisId", analysis._id))
        .collect();

      analyzedCalls.push({
        call,
        analysis,
        transcriptEntries,
      });

      if (analyzedCalls.length === 10) {
        break;
      }
    }

    if (analyzedCalls.length === 0) {
      return null;
    }

    const newestFirst = analyzedCalls;
    const chartOrder = [...newestFirst].reverse();
    const latest = newestFirst[0];
    const previous = newestFirst[1];

    const trendPoints = chartOrder.map(({ call, analysis }) => ({
      label: buildLabel(analysis.updatedAt),
      createdAt: analysis.updatedAt,
      callId: call._id,
      callTitle: call.title,
      overallRating: analysis.overallRating,
      closeRate: calculateCloseRate(analysis),
      quickness: analysis.quickness,
      introduction: analysis.introduction,
      knowledge: analysis.knowledge,
      hospitality: analysis.hospitality,
      callToAction: analysis.callToAction,
    }));

    const topObjections = Array.from(
      newestFirst
        .flatMap(({ transcriptEntries }) => transcriptEntries)
        .filter((entry) => entry.isObjection)
        .reduce((accumulator, entry) => {
          const normalized = normalizeObjectionLabel(entry.text);
          if (!normalized) {
            return accumulator;
          }

          const existing = accumulator.get(normalized);
          if (existing) {
            existing.count += 1;
            return accumulator;
          }

          accumulator.set(normalized, {
            label: summarizeObjectionLabel(entry.text),
            count: 1,
          });
          return accumulator;
        }, new Map<string, { label: string; count: number }>()),
    )
      .map(([, value]) => value)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const latestCloseRate = calculateCloseRate(latest.analysis);
    const previousCloseRate = previous
      ? calculateCloseRate(previous.analysis)
      : latestCloseRate;

    const now = Date.now();

    const snapshotId = await ctx.db.insert("analytics", {
      teamId,
      ownerUserId,
      latestCallId: latest.call._id,
      latestCallTitle: latest.call.title,
      sourceCallIds: newestFirst.map(({ call }) => call._id),
      sourceCallTitles: newestFirst.map(({ call }) => call.title),
      trendPoints,
      currentMetrics: {
        overallRating: latest.analysis.overallRating,
        closeRate: latestCloseRate,
        quickness: latest.analysis.quickness,
        introduction: latest.analysis.introduction,
        knowledge: latest.analysis.knowledge,
        hospitality: latest.analysis.hospitality,
        callToAction: latest.analysis.callToAction,
      },
      metricDeltas: {
        overallRating:
          latest.analysis.overallRating -
          (previous?.analysis.overallRating ?? latest.analysis.overallRating),
        closeRate: latestCloseRate - previousCloseRate,
        quickness:
          latest.analysis.quickness -
          (previous?.analysis.quickness ?? latest.analysis.quickness),
        introduction:
          latest.analysis.introduction -
          (previous?.analysis.introduction ?? latest.analysis.introduction),
        knowledge:
          latest.analysis.knowledge -
          (previous?.analysis.knowledge ?? latest.analysis.knowledge),
        hospitality:
          latest.analysis.hospitality -
          (previous?.analysis.hospitality ?? latest.analysis.hospitality),
        callToAction:
          latest.analysis.callToAction -
          (previous?.analysis.callToAction ?? latest.analysis.callToAction),
      },
      topObjections,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.runMutation(internal.notifications.createNotification, {
      teamId,
      ownerUserId,
      level:
        latest.analysis.callToAction < 70 || latest.analysis.introduction < 70
          ? "warning"
          : "info",
      title:
        latest.analysis.callToAction < 70
          ? "Analytics Alert: CTA Score Below Threshold"
          : "Analytics Snapshot Ready",
      message:
        latest.analysis.callToAction < 70
          ? `Your latest analytics snapshot shows a call-to-action score of ${latest.analysis.callToAction}. Review the trend and closing guidance.`
          : `A new analytics snapshot was generated from up to ${newestFirst.length} recent analyzed calls.`,
      href: "/analytics",
      sourceType: "analytics",
      sourceCallId: latest.call._id,
    });

    return snapshotId;
  },
});
