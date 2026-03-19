export type CurrentSession = {
  _id: string;
  title: string;
  description?: string;
  sellerPhoneNumber: string;
  clientPhoneNumber: string;
  callMode?: "call_my_phone" | "call_in_app";
  status: string;
  handledBy: "web" | "mobile";
  handlerLabel?: string;
  platformOrigin: "ios" | "android" | "web";
  durationSeconds?: number;
  recordingStatus?: string;
  archivedCallId?: string;
  updatedAt: number;
};
