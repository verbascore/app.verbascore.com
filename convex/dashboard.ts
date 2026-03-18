import { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireTeamMembership } from "./lib/teamAccess";

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export const getHomeDashboard = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireTeamMembership(ctx);
    const teamId = membership.teamId;

    const analyticsSnapshots = await ctx.db
      .query("analytics")
      .withIndex("by_team_created_at", (q) => q.eq("teamId", teamId))
      .order("desc")
      .collect();

    const feedbackSnapshots = await ctx.db
      .query("feedback")
      .withIndex("by_team_created_at", (q) => q.eq("teamId", teamId))
      .order("desc")
      .collect();

    const calls = await ctx.db
      .query("calls")
      .withIndex("by_team_updated_at", (q) => q.eq("teamId", teamId))
      .order("desc")
      .collect();

    const recentCalls: Array<{
      _id: Doc<"calls">["_id"];
      title: string;
      createdAt: number;
      overallRating: number | null;
    }> = [];
    let analyzedCallsCount = 0;

    for (const call of calls) {
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
        });
      }
    }

    const latestAnalytics = analyticsSnapshots[0] ?? null;
    const latestFeedback = feedbackSnapshots[0] ?? null;

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
