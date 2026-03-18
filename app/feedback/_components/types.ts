export type FeedbackRecommendation = {
  priority: "high" | "medium" | "low";
  status: "new" | "in_progress" | "watch";
  title: string;
  description: string;
  linkedCallIds: string[];
  linkedCallTitles: string[];
  resourceTitle: string;
};

export type FeedbackSnapshot = {
  _id: string;
  latestCallId: string;
  latestCallTitle: string;
  sourceCallIds: string[];
  sourceCallTitles: string[];
  focusItems: string[];
  recommendations: FeedbackRecommendation[];
  createdAt: number;
};

export type ActivePendingAnalysis = {
  callId: string;
  status: "queued" | "processing";
  progress: number;
  currentStep: string;
  updatedAt: number;
};

export type SellerOption = {
  userId: string;
  name: string;
  email?: string;
};

export type FeedbackDashboardSlice = {
  snapshots: FeedbackSnapshot[];
  activePendingAnalysis: ActivePendingAnalysis | null;
};

export type FeedbackDashboardData = {
  snapshots: FeedbackSnapshot[];
  activePendingAnalysis: ActivePendingAnalysis | null;
  sellerOptions: SellerOption[];
  dashboardsBySeller: Record<string, FeedbackDashboardSlice>;
  averageDashboard: FeedbackDashboardSlice | null;
};
