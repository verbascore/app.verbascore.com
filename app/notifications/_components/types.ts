export type NotificationLevel = "critical" | "warning" | "info";

export type NotificationItem = {
  _id: string;
  ownerUserId: string;
  level: NotificationLevel;
  title: string;
  message: string;
  href?: string;
  isBookmarked: boolean;
  createdAt: number;
  sellerName?: string;
  sellerEmail?: string;
};
