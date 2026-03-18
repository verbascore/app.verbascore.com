"use client";

import { SellerNotificationsView } from "./seller-notifications-view";
import { NotificationItem, NotificationLevel } from "./types";

export function OwnerNotificationsView(props: {
  notifications: NotificationItem[] | undefined;
  filtered: NotificationItem[];
  filter: "all" | NotificationLevel;
  onFilterChange: (value: "all" | NotificationLevel) => void;
}) {
  return <SellerNotificationsView {...props} />;
}
