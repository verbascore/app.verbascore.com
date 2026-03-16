import { ConvexError, v } from "convex/values";

import { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, query } from "./_generated/server";

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

const metricMeta = {
  quickness: {
    label: "Quickness",
    resourceTitle: "Fast Opening Checklist",
  },
  introduction: {
    label: "Introduction",
    resourceTitle: "Opening Framework Playbook",
  },
  knowledge: {
    label: "Product Knowledge",
    resourceTitle: "Discovery and Product Mapping Guide",
  },
  hospitality: {
    label: "Hospitality",
    resourceTitle: "Energy Management for Sales",
  },
  callToAction: {
    label: "Call-to-Action",
    resourceTitle: "Closing Techniques Script",
  },
} as const;

type MetricKey = keyof typeof metricMeta;

function average(values: number[]) {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
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
  return sentence.length > 56 ? `${sentence.slice(0, 53)}...` : sentence;
}

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    const snapshots = await ctx.db
      .query("feedback")
      .withIndex("by_owner_created_at", (q) =>
        q.eq("ownerUserId", identity.subject),
      )
      .order("desc")
      .collect();

    const pendingAnalyses = await ctx.db
      .query("pending_analysis")
      .withIndex("by_owner_user", (q) => q.eq("ownerUserId", identity.subject))
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
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_owner_updated_at", (q) => q.eq("ownerUserId", ownerUserId))
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
    const latest = newestFirst[0];
    const previous = newestFirst[1];
    const sourceCallIds = newestFirst.map(({ call }) => call._id);
    const sourceCallTitles = newestFirst.map(({ call }) => call.title);

    const metricAverages = {
      quickness: average(newestFirst.map(({ analysis }) => analysis.quickness)),
      introduction: average(
        newestFirst.map(({ analysis }) => analysis.introduction),
      ),
      knowledge: average(newestFirst.map(({ analysis }) => analysis.knowledge)),
      hospitality: average(
        newestFirst.map(({ analysis }) => analysis.hospitality),
      ),
      callToAction: average(
        newestFirst.map(({ analysis }) => analysis.callToAction),
      ),
    };

    const weakestMetrics = (
      Object.entries(metricAverages) as Array<[MetricKey, number]>
    )
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);

    const focusItems = weakestMetrics.map(([metric]) => {
      switch (metric) {
        case "introduction":
          return "Start every call with the customer's name and a clear agenda within the first 15 seconds";
        case "quickness":
          return "Reduce the time to the first relevant discovery question so the conversation gains momentum faster";
        case "knowledge":
          return "Anchor product explanations to the buyer's specific use case before listing capabilities";
        case "hospitality":
          return "Slow down after objections and acknowledge the concern before redirecting the conversation";
        case "callToAction":
          return "End every call with a specific next step, owner, and timeline";
      }
    });

    const recommendations: Array<{
      priority: "high" | "medium" | "low";
      status: "new" | "in_progress" | "watch";
      title: string;
      description: string;
      linkedCallIds: typeof sourceCallIds;
      linkedCallTitles: typeof sourceCallTitles;
      resourceTitle: string;
    }> = [];

    const ctaDrop =
      latest.analysis.callToAction -
      (previous?.analysis.callToAction ?? latest.analysis.callToAction);
    if (latest.analysis.callToAction <= 78 || ctaDrop < 0) {
      recommendations.push({
        priority: "high",
        status: "new",
        title: "Strengthen Call-to-Action Closings",
        description:
          ctaDrop < 0
            ? `Your CTA score dropped ${Math.abs(ctaDrop)} points from the prior analyzed call. Focus on proposing a concrete next step instead of ending with open-ended follow-ups.`
            : "Recent calls are ending without a strong next-step commitment. Focus on confirming the owner, deliverable, and deadline before wrapping.",
        linkedCallIds: sourceCallIds,
        linkedCallTitles: sourceCallTitles,
        resourceTitle: metricMeta.callToAction.resourceTitle,
      });
    }

    const objectionEntries = newestFirst.flatMap(({ transcriptEntries }) =>
      transcriptEntries.filter((entry) => entry.isObjection),
    );
    if (objectionEntries.length > 0) {
      const topObjection = Array.from(
        objectionEntries.reduce((accumulator, entry) => {
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
      ).sort((a, b) => b[1].count - a[1].count)[0]?.[1];

      recommendations.push({
        priority: "high",
        status: "in_progress",
        title: "Improve Objection Handling",
        description: topObjection
          ? `The objection "${topObjection.label}" keeps showing up across recent calls. Use an acknowledge-bridge-benefit response before returning to value.`
          : "Pricing and fit objections are surfacing repeatedly. Practice acknowledging the concern, bridging back to the use case, and restating business value.",
        linkedCallIds: sourceCallIds,
        linkedCallTitles: sourceCallTitles,
        resourceTitle: "Objection Handling Playbook",
      });
    }

    if (latest.analysis.hospitality <= 80 || metricAverages.hospitality <= 82) {
      recommendations.push({
        priority: "medium",
        status: "new",
        title: "Raise Hospitality Consistency",
        description:
          "Your hospitality signal is softer than the rest of your scorecard. Add one empathy statement after pushback and mirror the buyer's phrasing before answering.",
        linkedCallIds: sourceCallIds,
        linkedCallTitles: sourceCallTitles,
        resourceTitle: metricMeta.hospitality.resourceTitle,
      });
    }

    if (recommendations.length < 3) {
      recommendations.push({
        priority: "medium",
        status: "watch",
        title: "Tighten Early Discovery",
        description:
          "Move from intro to discovery faster by asking a role-specific problem question earlier in the conversation and adapting examples to the answer.",
        linkedCallIds: sourceCallIds,
        linkedCallTitles: sourceCallTitles,
        resourceTitle: metricMeta.quickness.resourceTitle,
      });
    }

    const now = Date.now();

    const snapshotId = await ctx.db.insert("feedback", {
      ownerUserId,
      latestCallId: latest.call._id,
      latestCallTitle: latest.call.title,
      sourceCallIds,
      sourceCallTitles,
      focusItems,
      recommendations: recommendations.slice(0, 4),
      createdAt: now,
      updatedAt: now,
    });

    await ctx.runMutation(internal.notifications.createNotification, {
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
