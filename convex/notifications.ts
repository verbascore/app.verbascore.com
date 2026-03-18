import { ConvexError, v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import {
  assertCanManageEntity,
  assertTeamAccess,
  requireTeamMembership,
} from "./lib/teamAccess";

export const listNotifications = query({
  args: {},
  handler: async (ctx) => {
    const { membership } = await requireTeamMembership(ctx);
    const now = Date.now();

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_team_created_at", (q) =>
        q.eq("teamId", membership.teamId),
      )
      .order("desc")
      .collect();

    return notifications.filter(
      (notification) =>
        !notification.snoozedUntil || notification.snoozedUntil <= now,
    );
  },
});

export const toggleBookmark = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireTeamMembership(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new ConvexError("Notification not found");
    }

    assertTeamAccess({ membership, teamId: notification.teamId });
    assertCanManageEntity({ membership, ownerUserId: notification.ownerUserId });

    await ctx.db.patch(args.notificationId, {
      isBookmarked: !notification.isBookmarked,
      updatedAt: Date.now(),
    });
  },
});

export const snoozeNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireTeamMembership(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new ConvexError("Notification not found");
    }

    assertTeamAccess({ membership, teamId: notification.teamId });
    assertCanManageEntity({ membership, ownerUserId: notification.ownerUserId });

    const now = Date.now();
    await ctx.db.patch(args.notificationId, {
      snoozedUntil: now + (args.hours ?? 24) * 60 * 60 * 1000,
      updatedAt: now,
    });
  },
});

export const createNotification = internalMutation({
  args: {
    teamId: v.id("teams"),
    ownerUserId: v.string(),
    level: v.union(
      v.literal("critical"),
      v.literal("warning"),
      v.literal("info"),
    ),
    title: v.string(),
    message: v.string(),
    href: v.optional(v.string()),
    sourceType: v.union(
      v.literal("call_analysis"),
      v.literal("analytics"),
      v.literal("feedback"),
    ),
    sourceCallId: v.optional(v.id("calls")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("notifications", {
      teamId: args.teamId,
      ownerUserId: args.ownerUserId,
      level: args.level,
      title: args.title,
      message: args.message,
      href: args.href,
      sourceType: args.sourceType,
      sourceCallId: args.sourceCallId,
      isBookmarked: false,
      snoozedUntil: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});
