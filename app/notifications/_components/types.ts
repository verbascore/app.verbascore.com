export type NotificationLevel = "critical" | "warning" | "info";

export type NotificationItem = {
  _id: string;
  level: NotificationLevel;
  title: string;
  message: string;
  href?: string;
  isBookmarked: boolean;
  createdAt: number;
};
