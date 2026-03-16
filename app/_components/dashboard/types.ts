export type DashboardAnalyticsSnapshot = {
  latestCallId: string;
  latestCallTitle: string;
  trendPoints: Array<{
    label: string;
    overallRating: number;
    quickness: number;
    introduction: number;
    knowledge: number;
    hospitality: number;
    callToAction: number;
    closeRate: number;
  }>;
  currentMetrics: {
    overallRating: number;
    closeRate: number;
    quickness: number;
    introduction: number;
    knowledge: number;
    hospitality: number;
    callToAction: number;
  };
  metricDeltas: {
    overallRating: number;
    closeRate: number;
    quickness: number;
    introduction: number;
    knowledge: number;
    hospitality: number;
    callToAction: number;
  };
};

export type DashboardFeedbackSnapshot = {
  focusItems: string[];
  recommendations: Array<{
    title: string;
    priority: "high" | "medium" | "low";
    resourceTitle: string;
  }>;
};

export type DashboardCall = {
  _id: string;
  title: string;
  createdAt: number;
  overallRating: number | null;
};

export type HomeDashboardData = {
  latestAnalytics: DashboardAnalyticsSnapshot | null;
  latestFeedback: DashboardFeedbackSnapshot | null;
  analyzedCallsCount: number;
  recentCalls: DashboardCall[];
  strengths: string[];
  weaknesses: string[];
  criticalErrors: string[];
  recommendedMaterials: string[];
};
