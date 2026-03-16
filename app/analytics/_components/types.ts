export type TrendPoint = {
  label: string;
  createdAt: number;
  callId: string;
  callTitle: string;
  overallRating: number;
  closeRate: number;
  quickness: number;
  introduction: number;
  knowledge: number;
  hospitality: number;
  callToAction: number;
};

export type AnalyticsSnapshot = {
  _id: string;
  latestCallId: string;
  latestCallTitle: string;
  sourceCallIds: string[];
  sourceCallTitles: string[];
  trendPoints: TrendPoint[];
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
  topObjections: Array<{
    label: string;
    count: number;
  }>;
  createdAt: number;
};

export type ActivePendingAnalysis = {
  callId: string;
  status: "queued" | "processing";
  progress: number;
  currentStep: string;
  updatedAt: number;
};

export type AnalyticsDashboardData = {
  snapshots: AnalyticsSnapshot[];
  activePendingAnalysis: ActivePendingAnalysis | null;
};

export type MetricKey =
  | "overallRating"
  | "quickness"
  | "introduction"
  | "knowledge"
  | "hospitality"
  | "callToAction";
