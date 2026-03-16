export type CallRowData = {
  _id: string;
  title: string;
  description?: string;
  createdAt: number;
  analysis: {
    overallRating: number;
  } | null;
  pendingAnalysis: {
    status: "queued" | "processing" | "completed" | "failed";
  } | null;
};

export type CallStatus = {
  label: string;
  variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
};
