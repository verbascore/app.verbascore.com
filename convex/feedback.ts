import { ConvexError, v } from "convex/values";

import { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, query } from "./_generated/server";
import { requireTeamMembership } from "./lib/teamAccess";
import {
  buildFeedbackSnapshots,
  getActivePendingAnalysis,
  listAnalyzedEntries,
  listTeamSellers,
} from "./lib/performance";

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireTeamMembership(ctx);
    const sellerOptions = await listTeamSellers(ctx.db, membership.teamId);

    if (membership.role === "owner") {
      const averageOwnerIds = sellerOptions.map((seller) => seller.userId);
      const averageDashboard = {
        snapshots: buildFeedbackSnapshots(
          await listAnalyzedEntries({
            db: ctx.db,
            teamId: membership.teamId,
            ownerUserIds: averageOwnerIds,
          }),
        ),
        activePendingAnalysis: await getActivePendingAnalysis({
          db: ctx.db,
          teamId: membership.teamId,
          ownerUserIds: averageOwnerIds,
        }),
      };

      const dashboardsBySeller = Object.fromEntries(
        await Promise.all(
          sellerOptions.map(async (seller) => {
            const ownerUserIds = [seller.userId];
            return [
              seller.userId,
              {
                snapshots: buildFeedbackSnapshots(
                  await listAnalyzedEntries({
                    db: ctx.db,
                    teamId: membership.teamId,
                    ownerUserIds,
                  }),
                ),
                activePendingAnalysis: await getActivePendingAnalysis({
                  db: ctx.db,
                  teamId: membership.teamId,
                  ownerUserIds,
                }),
              },
            ];
          }),
        ),
      );

      return {
        snapshots: [],
        activePendingAnalysis: null,
        sellerOptions,
        dashboardsBySeller,
        averageDashboard,
      };
    }

    const ownerUserIds = [membership.userId];
    return {
      snapshots: buildFeedbackSnapshots(
        await listAnalyzedEntries({
          db: ctx.db,
          teamId: membership.teamId,
          ownerUserIds,
        }),
      ),
      activePendingAnalysis: await getActivePendingAnalysis({
        db: ctx.db,
        teamId: membership.teamId,
        ownerUserIds,
      }),
      sellerOptions: [],
      dashboardsBySeller: {},
      averageDashboard: null,
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
      if (call.ownerUserId !== ownerUserId) {
        continue;
      }

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

    const synthesizedSnapshot = buildFeedbackSnapshots(analyzedCalls)[0];
    const latest = analyzedCalls[0];

    if (!synthesizedSnapshot) {
      return null;
    }

    const now = Date.now();
    const recommendations = synthesizedSnapshot.recommendations.slice(0, 4);

    const snapshotId = await ctx.db.insert("feedback", {
      teamId,
      ownerUserId,
      latestCallId: latest.call._id,
      latestCallTitle: latest.call.title,
      sourceCallIds: synthesizedSnapshot.sourceCallIds,
      sourceCallTitles: synthesizedSnapshot.sourceCallTitles,
      focusItems: synthesizedSnapshot.focusItems,
      recommendations,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.runMutation(internal.notifications.createNotification, {
      teamId,
      ownerUserId,
      level: recommendations.some((item) => item.priority === "high")
        ? "warning"
        : "info",
      title: recommendations.some((item) => item.priority === "high")
        ? "Feedback Alert: High-Priority Coaching Added"
        : "Feedback Snapshot Ready",
      message: recommendations.some((item) => item.priority === "high")
        ? `New coaching feedback was generated and includes ${recommendations.filter((item) => item.priority === "high").length} high-priority recommendation(s).`
        : "A new feedback snapshot is ready with action items for your next calls.",
      href: "/feedback",
      sourceType: "feedback",
      sourceCallId: latest.call._id,
    });

    return snapshotId;
  },
});
