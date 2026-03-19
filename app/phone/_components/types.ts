export type CurrentSession = {
  _id: string;
  title: string;
  description?: string;
  sellerPhoneNumber: string;
  clientPhoneNumber: string;
  status: string;
  handledBy: "web" | "mobile";
  handlerLabel?: string;
  platformOrigin: "ios" | "android" | "web";
  durationSeconds?: number;
  updatedAt: number;
};
