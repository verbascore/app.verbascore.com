export type TranscriptEntry = {
  channel: "seller" | "client";
  text: string;
  startTimestampMs: number;
  endTimestampMs?: number;
  rating: number;
  isObjection: boolean;
};

export type CallAnalysis = {
  aiSummary: string;
  quickness: number;
  introduction: number;
  knowledge: number;
  hospitality: number;
  callToAction: number;
  overallRating: number;
};

export type PendingAnalysis = {
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  currentStep: string;
  errorMessage?: string;
};

export type CallDetailsData = {
  title: string;
  description?: string;
  createdAt: number;
  sellerAudioUrl: string | null;
  clientAudioUrl: string | null;
  transcriptEntries: TranscriptEntry[];
  analysis: CallAnalysis | null;
  pendingAnalysis: PendingAnalysis | null;
};
