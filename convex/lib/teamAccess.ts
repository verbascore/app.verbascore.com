import { ConvexError } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type {
  DatabaseReader,
  MutationCtx,
  QueryCtx,
} from "../_generated/server";

type Identity = {
  subject: string;
  name?: string | null;
  email?: string | null;
  pictureUrl?: string | null;
};

type AuthCtx = Pick<QueryCtx, "auth"> | Pick<MutationCtx, "auth">;

export type TeamRole = Doc<"teamMembers">["role"];

export async function requireIdentity(ctx: AuthCtx) {
  const identity = (await ctx.auth.getUserIdentity()) as Identity | null;

  if (!identity) {
    throw new ConvexError("Unauthorized");
  }

  return identity;
}

export async function getCurrentMembership(
  db: DatabaseReader,
  userId: string,
) {
  return (
    await db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
  ).sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;
}

export async function getUserMemberships(
  db: DatabaseReader,
  userId: string,
) {
  return (
    await db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
  ).sort((a, b) => a.createdAt - b.createdAt);
}

export async function getUserProfile(
  db: DatabaseReader,
  userId: string,
) {
  return await db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
}

export async function resolveCurrentMembership(
  db: DatabaseReader,
  userId: string,
) {
  const [memberships, profile] = await Promise.all([
    getUserMemberships(db, userId),
    getUserProfile(db, userId),
  ]);

  if (memberships.length === 0) {
    return null;
  }

  if (profile?.activeTeamId) {
    const activeMembership = memberships.find(
      (membership) => membership.teamId === profile.activeTeamId,
    );

    if (activeMembership) {
      return activeMembership;
    }
  }

  return memberships[0];
}

export async function upsertUserProfile(args: {
  ctx: Pick<MutationCtx, "db">;
  userId: string;
  activeTeamId?: Id<"teams">;
}) {
  const existingProfile = await args.ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .first();
  const now = Date.now();

  if (existingProfile) {
    await args.ctx.db.patch(existingProfile._id, {
      activeTeamId: args.activeTeamId,
      updatedAt: now,
    });
    return existingProfile._id;
  }

  return await args.ctx.db.insert("userProfiles", {
    userId: args.userId,
    activeTeamId: args.activeTeamId,
    createdAt: now,
    updatedAt: now,
  });
}

export async function clearUserActiveTeamIfMatches(args: {
  ctx: Pick<MutationCtx, "db">;
  userId: string;
  teamId: Id<"teams">;
}) {
  const profile = await getUserProfile(args.ctx.db, args.userId);

  if (!profile || profile.activeTeamId !== args.teamId) {
    return;
  }

  const nextMembership = (
    await getUserMemberships(args.ctx.db, args.userId)
  ).find((membership) => membership.teamId !== args.teamId);

  await args.ctx.db.patch(profile._id, {
    activeTeamId: nextMembership?.teamId,
    updatedAt: Date.now(),
  });
}

export async function getMembershipByTeamAndUser(args: {
  db: DatabaseReader;
  teamId: Id<"teams">;
  userId: string;
}) {
  return await args.db
    .query("teamMembers")
    .withIndex("by_user_team", (q) =>
      q.eq("userId", args.userId).eq("teamId", args.teamId),
    )
    .first();
}

export async function requireTeamMembership(
  ctx: (Pick<QueryCtx, "auth" | "db"> | Pick<MutationCtx, "auth" | "db">),
) {
  const identity = await requireIdentity(ctx);
  const membership = await resolveCurrentMembership(ctx.db, identity.subject);

  if (!membership) {
    throw new ConvexError("You need to create or join a team first.");
  }

  const team = await ctx.db.get(membership.teamId);

  if (!team) {
    throw new ConvexError("Team not found");
  }

  return {
    identity,
    membership,
    team,
  };
}

export function canManageEntity(args: {
  membership: Doc<"teamMembers">;
  ownerUserId: string;
}) {
  return (
    args.membership.role === "owner" ||
    args.membership.userId === args.ownerUserId
  );
}

export function assertCanManageEntity(args: {
  membership: Doc<"teamMembers">;
  ownerUserId: string;
}) {
  if (!canManageEntity(args)) {
    throw new ConvexError("You do not have permission to modify this record.");
  }
}

export function assertRole(
  membership: Doc<"teamMembers">,
  allowedRoles: TeamRole[],
) {
  if (!allowedRoles.includes(membership.role)) {
    throw new ConvexError("You do not have permission to perform this action.");
  }
}

export function assertTeamAccess(args: {
  membership: Doc<"teamMembers">;
  teamId: Id<"teams">;
}) {
  if (args.membership.teamId !== args.teamId) {
    throw new ConvexError("Record not found");
  }
}
