import { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireTeamMembership } from "./lib/teamAccess";
import {
  buildAnalyticsSnapshots,
  buildFeedbackSnapshots,
  listAnalyzedEntries,
  listTeamSellers,
} from "./lib/performance";

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export const getHomeDashboard = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireTeamMembership(ctx);
    const teamId = membership.teamId;
    const sellerOptions = await listTeamSellers(ctx.db, teamId);
    const scopedUserIds =
      membership.role === "owner"
        ? sellerOptions.map((seller) => seller.userId)
        : [membership.userId];

    const calls = await ctx.db
      .query("calls")
      .withIndex("by_team_updated_at", (q) => q.eq("teamId", teamId))
      .order("desc")
      .collect();
    const visibleCalls = calls.filter((call) =>
      scopedUserIds.includes(call.ownerUserId),
    );
    const sellerMap = new Map(
      sellerOptions.map((seller) => [seller.userId, seller.name]),
    );
    const analyzedEntries = await listAnalyzedEntries({
      db: ctx.db,
      teamId,
      ownerUserIds: scopedUserIds,
    });
    const latestAnalytics = buildAnalyticsSnapshots(analyzedEntries)[0] ?? null;
    const latestFeedback = buildFeedbackSnapshots(analyzedEntries)[0] ?? null;

    const recentCalls: Array<{
      _id: Doc<"calls">["_id"];
      title: string;
      createdAt: number;
      overallRating: number | null;
      sellerName?: string;
    }> = [];
    let analyzedCallsCount = 0;

    for (const call of visibleCalls) {
      const analysis = await ctx.db
        .query("callAnalyses")
        .withIndex("by_call", (q) => q.eq("callId", call._id))
        .first();

      if (analysis) {
        analyzedCallsCount += 1;
      }

      if (recentCalls.length < 5) {
        recentCalls.push({
          _id: call._id,
          title: call.title,
          createdAt: call.createdAt,
          overallRating: analysis?.overallRating ?? null,
          sellerName: sellerMap.get(call.ownerUserId),
        });
      }
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (latestAnalytics) {
      const metrics = latestAnalytics.currentMetrics;

      if (metrics.knowledge >= 85) {
        strengths.push("Product knowledge consistently lands above 85.");
      }
      if (metrics.quickness >= 80) {
        strengths.push("Calls are getting to discovery questions quickly.");
      }
      if (metrics.overallRating >= 80) {
        strengths.push("Overall call quality is trending in a strong range.");
      }

      if (metrics.callToAction < 80) {
        weaknesses.push("Call-to-action needs more specific next steps.");
      }
      if (metrics.hospitality < 80) {
        weaknesses.push("Hospitality dips after objections or tough moments.");
      }
      if (metrics.introduction < 80) {
        weaknesses.push("Openings need a clearer agenda and stronger framing.");
      }
    }

    const criticalErrors = unique(
      (latestFeedback?.recommendations ?? [])
        .filter((item) => item.priority === "high")
        .map((item) => item.title),
    ).slice(0, 3);

    const recommendedMaterials = unique(
      (latestFeedback?.recommendations ?? []).map((item) => item.resourceTitle),
    ).slice(0, 3);

    return {
      latestAnalytics,
      latestFeedback,
      analyzedCallsCount,
      recentCalls,
      strengths,
      weaknesses,
      criticalErrors,
      recommendedMaterials,
    };
  },
});
