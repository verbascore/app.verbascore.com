import { ConvexError, v } from "convex/values";

import { mutation, query, type MutationCtx } from "./_generated/server";
import {
  assertRole,
  clearUserActiveTeamIfMatches,
  getMembershipByTeamAndUser,
  getUserMemberships,
  getUserProfile,
  requireIdentity,
  requireTeamMembership,
  resolveCurrentMembership,
  upsertUserProfile,
} from "./lib/teamAccess";

function buildInviteCode(seed: string, attempt: number) {
  const normalizedSeed = seed.replace(/[^a-z0-9]/gi, "").toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();

  return `${normalizedSeed}${timestamp}${attempt}`.slice(-6);
}

async function generateInviteCode(ctx: MutationCtx, seed: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const inviteCode = buildInviteCode(seed, attempt);
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();

    if (!existingTeam) {
      return inviteCode;
    }
  }

  throw new ConvexError("Unable to generate a unique invite code.");
}

export const getCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const [membership, memberships] = await Promise.all([
      resolveCurrentMembership(ctx.db, identity.subject),
      getUserMemberships(ctx.db, identity.subject),
    ]);

    if (!membership) {
      return {
        team: null,
        membership: null,
        members: [],
        teams: [],
      };
    }

    const [team, members, teams] = await Promise.all([
      ctx.db.get(membership.teamId),
      ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
        .collect(),
      Promise.all(
        memberships.map(async (entry) => {
          const teamRecord = await ctx.db.get(entry.teamId);

          if (!teamRecord) {
            return null;
          }

          return {
            ...teamRecord,
            role: entry.role,
            membershipId: entry._id,
          };
        }),
      ),
    ]);

    if (!team) {
      throw new ConvexError("Team not found");
    }

    return {
      team,
      membership,
      members: members.sort((a, b) => {
        if (a.role !== b.role) {
          return a.role === "owner" ? -1 : 1;
        }

        return (a.name ?? a.email ?? a.userId).localeCompare(
          b.name ?? b.email ?? b.userId,
        );
      }),
      teams: teams
        .filter((entry) => entry !== null)
        .sort((a, b) => a.title.localeCompare(b.title)),
    };
  },
});

export const createTeam = mutation({
  args: {
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const title = args.title.trim();
    const description = args.description.trim();

    if (!title) {
      throw new ConvexError("Team title is required.");
    }

    if (!description) {
      throw new ConvexError("Team description is required.");
    }

    const now = Date.now();
    const inviteCode = await generateInviteCode(ctx, identity.subject);
    const teamId = await ctx.db.insert("teams", {
      title,
      description,
      inviteCode,
      createdByUserId: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId: identity.subject,
      role: "owner",
      name: identity.name ?? undefined,
      email: identity.email ?? undefined,
      imageUrl: identity.pictureUrl ?? undefined,
      createdAt: now,
      updatedAt: now,
    });

    await upsertUserProfile({
      ctx,
      userId: identity.subject,
      activeTeamId: teamId,
    });

    return teamId;
  },
});

export const joinTeam = mutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const inviteCode = args.inviteCode.trim().toUpperCase();

    if (!inviteCode) {
      throw new ConvexError("Invite code is required.");
    }

    const team = await ctx.db
      .query("teams")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();

    if (!team) {
      throw new ConvexError("Invalid invite code.");
    }

    const existingMembership = await getMembershipByTeamAndUser({
      db: ctx.db,
      teamId: team._id,
      userId: identity.subject,
    });

    if (existingMembership) {
      await upsertUserProfile({
        ctx,
        userId: identity.subject,
        activeTeamId: team._id,
      });

      return existingMembership._id;
    }

    const now = Date.now();
    const membershipId = await ctx.db.insert("teamMembers", {
      teamId: team._id,
      userId: identity.subject,
      role: "seller",
      name: identity.name ?? undefined,
      email: identity.email ?? undefined,
      imageUrl: identity.pictureUrl ?? undefined,
      createdAt: now,
      updatedAt: now,
    });

    await upsertUserProfile({
      ctx,
      userId: identity.subject,
      activeTeamId: team._id,
    });

    return membershipId;
  },
});

export const switchTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const membership = await getMembershipByTeamAndUser({
      db: ctx.db,
      teamId: args.teamId,
      userId: identity.subject,
    });

    if (!membership) {
      throw new ConvexError("You are not a member of that team.");
    }

    await upsertUserProfile({
      ctx,
      userId: identity.subject,
      activeTeamId: args.teamId,
    });
  },
});

export const updateTeam = mutation({
  args: {
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership, team } = await requireTeamMembership(ctx);
    assertRole(membership, ["owner"]);
    const title = args.title.trim();
    const description = args.description.trim();

    if (!title) {
      throw new ConvexError("Team title is required.");
    }

    if (!description) {
      throw new ConvexError("Team description is required.");
    }

    await ctx.db.patch(team._id, {
      title,
      description,
      updatedAt: Date.now(),
    });
  },
});

export const updateMemberRole = mutation({
  args: {
    memberId: v.id("teamMembers"),
    role: v.union(v.literal("owner"), v.literal("seller")),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireTeamMembership(ctx);
    assertRole(membership, ["owner"]);

    const member = await ctx.db.get(args.memberId);

    if (!member || member.teamId !== membership.teamId) {
      throw new ConvexError("Member not found");
    }

    if (member.role === "owner" && args.role === "seller") {
      const owners = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
        .collect();

      if (owners.filter((entry) => entry.role === "owner").length === 1) {
        throw new ConvexError("Your team must have at least one owner.");
      }
    }

    await ctx.db.patch(member._id, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});

export const regenerateInviteCode = mutation({
  args: {},
  handler: async (ctx) => {
    const { membership, team } = await requireTeamMembership(ctx);
    assertRole(membership, ["owner"]);

    const inviteCode = await generateInviteCode(ctx, team._id);

    await ctx.db.patch(team._id, {
      inviteCode,
      updatedAt: Date.now(),
    });

    return inviteCode;
  },
});

export const getTeamManagementData = query({
  args: {},
  handler: async (ctx) => {
    const { membership, team } = await requireTeamMembership(ctx);
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
      .collect();

    return {
      team,
      membership,
      members: members.sort((a, b) => {
        if (a.role !== b.role) {
          return a.role === "owner" ? -1 : 1;
        }

        return (a.name ?? a.email ?? a.userId).localeCompare(
          b.name ?? b.email ?? b.userId,
        );
      }),
    };
  },
});

export const removeMember = mutation({
  args: {
    memberId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireTeamMembership(ctx);
    assertRole(membership, ["owner"]);

    const member = await ctx.db.get(args.memberId);

    if (!member || member.teamId !== membership.teamId) {
      throw new ConvexError("Member not found");
    }

    if (member.role === "owner") {
      const owners = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
        .collect();

      if (owners.filter((entry) => entry.role === "owner").length === 1) {
        throw new ConvexError("Your team must have at least one owner.");
      }
    }

    await clearUserActiveTeamIfMatches({
      ctx,
      userId: member.userId,
      teamId: membership.teamId,
    });

    await ctx.db.delete(member._id);
  },
});
