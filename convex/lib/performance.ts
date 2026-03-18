import { Doc } from "../_generated/dataModel";
import { DatabaseReader } from "../_generated/server";

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
  return sentence.length > 56 ? `${sentence.slice(0, 53)}...` : sentence;
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

function average(values: number[]) {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
}

export type SellerOption = {
  userId: string;
  name: string;
  email?: string;
};

export type PerformanceEntry = {
  call: Doc<"calls">;
  analysis: Doc<"callAnalyses">;
  transcriptEntries: Array<{
    text: string;
    isObjection: boolean;
  }>;
};

export async function listTeamSellers(
  db: DatabaseReader,
  teamId: Doc<"teamMembers">["teamId"],
) {
  const members = await db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  return members
    .filter((member) => member.role === "seller")
    .sort((a, b) => (a.name ?? a.email ?? a.userId).localeCompare(b.name ?? b.email ?? b.userId))
    .map((member) => ({
      userId: member.userId,
      name: member.name ?? member.email ?? member.userId,
      email: member.email,
    }));
}

export async function listAnalyzedEntries(args: {
  db: DatabaseReader;
  teamId: Doc<"teamMembers">["teamId"];
  ownerUserIds: string[];
}) {
  if (args.ownerUserIds.length === 0) {
    return [];
  }

  const ownerUserIds = new Set(args.ownerUserIds);
  const calls = await args.db
    .query("calls")
    .withIndex("by_team_updated_at", (q) => q.eq("teamId", args.teamId))
    .order("desc")
    .collect();

  const filteredCalls = calls.filter((call) => ownerUserIds.has(call.ownerUserId));
  const entries: PerformanceEntry[] = [];

  for (const call of filteredCalls) {
    const analysis = await args.db
      .query("callAnalyses")
      .withIndex("by_call", (q) => q.eq("callId", call._id))
      .first();

    if (!analysis) {
      continue;
    }

    const transcriptEntries = await args.db
      .query("callTranscriptEntries")
      .withIndex("by_analysis", (q) => q.eq("callAnalysisId", analysis._id))
      .collect();

    entries.push({
      call,
      analysis,
      transcriptEntries: transcriptEntries.map((entry) => ({
        text: entry.text,
        isObjection: entry.isObjection,
      })),
    });
  }

  return entries.sort((a, b) => b.analysis.updatedAt - a.analysis.updatedAt);
}

export async function getActivePendingAnalysis(args: {
  db: DatabaseReader;
  teamId: Doc<"teamMembers">["teamId"];
  ownerUserIds: string[];
}) {
  if (args.ownerUserIds.length === 0) {
    return null;
  }

  const ownerUserIds = new Set(args.ownerUserIds);
  const pendingAnalyses = await args.db
    .query("pending_analysis")
    .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
    .collect();

  const activePendingAnalysis = pendingAnalyses
    .filter(
      (entry) =>
        ownerUserIds.has(entry.ownerUserId) &&
        (entry.status === "queued" || entry.status === "processing"),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];

  return activePendingAnalysis
    ? {
        callId: activePendingAnalysis.callId,
        status: activePendingAnalysis.status,
        progress: activePendingAnalysis.progress,
        currentStep: activePendingAnalysis.currentStep,
        updatedAt: activePendingAnalysis.updatedAt,
      }
    : null;
}

export function buildAnalyticsSnapshots(entries: PerformanceEntry[]) {
  const ascendingEntries = [...entries].sort(
    (a, b) => a.analysis.updatedAt - b.analysis.updatedAt,
  );
  const snapshots = ascendingEntries.map((_, index) => {
    const windowEntries = ascendingEntries.slice(Math.max(0, index - 9), index + 1);
    const latest = windowEntries[windowEntries.length - 1];
    const previous = windowEntries[windowEntries.length - 2];
    const topObjections = Array.from(
      windowEntries
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

    return {
      _id: `analytics-${latest.call._id}-${latest.analysis.updatedAt}`,
      latestCallId: latest.call._id,
      latestCallTitle: latest.call.title,
      sourceCallIds: windowEntries.map(({ call }) => call._id),
      sourceCallTitles: windowEntries.map(({ call }) => call.title),
      trendPoints: windowEntries.map(({ call, analysis }) => ({
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
      })),
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
      createdAt: latest.analysis.updatedAt,
    };
  });

  return snapshots.reverse();
}

export function buildFeedbackSnapshots(entries: PerformanceEntry[]) {
  const ascendingEntries = [...entries].sort(
    (a, b) => a.analysis.updatedAt - b.analysis.updatedAt,
  );

  const snapshots = ascendingEntries.map((_, index) => {
    const windowEntries = ascendingEntries.slice(Math.max(0, index - 9), index + 1);
    const latest = windowEntries[windowEntries.length - 1];
    const previous = windowEntries[windowEntries.length - 2];
    const sourceCallIds = windowEntries.map(({ call }) => call._id);
    const sourceCallTitles = windowEntries.map(({ call }) => call.title);

    const metricAverages = {
      quickness: average(windowEntries.map(({ analysis }) => analysis.quickness)),
      introduction: average(
        windowEntries.map(({ analysis }) => analysis.introduction),
      ),
      knowledge: average(windowEntries.map(({ analysis }) => analysis.knowledge)),
      hospitality: average(
        windowEntries.map(({ analysis }) => analysis.hospitality),
      ),
      callToAction: average(
        windowEntries.map(({ analysis }) => analysis.callToAction),
      ),
    };

    const weakestMetrics = Object.entries(metricAverages)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([metric]) => metric);

    const focusItems = weakestMetrics.map((metric) => {
      switch (metric) {
        case "introduction":
          return "Start every call with the customer's name and a clear agenda within the first 15 seconds";
        case "quickness":
          return "Reduce the time to the first relevant discovery question so the conversation gains momentum faster";
        case "knowledge":
          return "Anchor product explanations to the buyer's specific use case before listing capabilities";
        case "hospitality":
          return "Slow down after objections and acknowledge the concern before redirecting the conversation";
        default:
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
        resourceTitle: "Closing Techniques Script",
      });
    }

    const objectionEntries = windowEntries.flatMap(({ transcriptEntries }) =>
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
          "Empathy is dropping on tougher moments. Practice labeling the concern before pivoting back to discovery or value.",
        linkedCallIds: sourceCallIds,
        linkedCallTitles: sourceCallTitles,
        resourceTitle: "Energy Management for Sales",
      });
    }

    if (metricAverages.knowledge <= 80) {
      recommendations.push({
        priority: "medium",
        status: "watch",
        title: "Sharpen Product Mapping",
        description:
          "Tie product detail more directly to the prospect's workflow so the explanation feels specific instead of generic.",
        linkedCallIds: sourceCallIds,
        linkedCallTitles: sourceCallTitles,
        resourceTitle: "Discovery and Product Mapping Guide",
      });
    }

    return {
      _id: `feedback-${latest.call._id}-${latest.analysis.updatedAt}`,
      latestCallId: latest.call._id,
      latestCallTitle: latest.call.title,
      sourceCallIds,
      sourceCallTitles,
      focusItems,
      recommendations,
      createdAt: latest.analysis.updatedAt,
    };
  });

  return snapshots.reverse();
}
