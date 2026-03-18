import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  assertRole,
  clearUserActiveTeamIfMatches,
  getMembershipByTeamAndUser,
  getUserMemberships,
  requireIdentity,
  requireTeamMembership,
  resolveCurrentMembership,
  upsertUserProfile,
} from "./lib/teamAccess";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createInvitationToken() {
  return crypto.randomUUID();
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
    const teamId = await ctx.db.insert("teams", {
      title,
      description,
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

export const createInvitation = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity, membership, team } = await requireTeamMembership(ctx);
    assertRole(membership, ["owner"]);
    const email = normalizeEmail(args.email);

    if (!email) {
      throw new ConvexError("Invite email is required.");
    }

    const existingPending = await ctx.db
      .query("teamInvitations")
      .withIndex("by_team_status", (q) =>
        q.eq("teamId", team._id).eq("status", "pending"),
      )
      .collect();

    const duplicate = existingPending.find((invite) => invite.email === email);
    if (duplicate) {
      throw new ConvexError("There is already a pending invitation for this email.");
    }

    const now = Date.now();
    const token = createInvitationToken();
    const invitationId = await ctx.db.insert("teamInvitations", {
      teamId: team._id,
      email,
      token,
      status: "pending",
      createdByUserId: identity.subject,
      acceptedByUserId: undefined,
      acceptedAt: undefined,
      revokedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return {
      invitationId,
      token,
    };
  },
});

export const revokeInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireTeamMembership(ctx);
    assertRole(membership, ["owner"]);

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.teamId !== membership.teamId) {
      throw new ConvexError("Invitation not found");
    }

    await ctx.db.patch(invitation._id, {
      status: "revoked",
      revokedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getInvitationDetails = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const invitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      return null;
    }

    const [team, existingMembership] = await Promise.all([
      ctx.db.get(invitation.teamId),
      getMembershipByTeamAndUser({
        db: ctx.db,
        teamId: invitation.teamId,
        userId: identity.subject,
      }),
    ]);

    if (!team) {
      return null;
    }

    return {
      invitation,
      team,
      alreadyMember: !!existingMembership,
      emailMatches: !identity.email
        ? true
        : normalizeEmail(identity.email) === invitation.email,
    };
  },
});

export const acceptInvitation = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const invitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new ConvexError("Invitation not found.");
    }

    if (invitation.status !== "pending") {
      throw new ConvexError("This invitation is no longer active.");
    }

    if (identity.email && normalizeEmail(identity.email) !== invitation.email) {
      throw new ConvexError(
        `Sign in with ${invitation.email} to accept this invitation.`,
      );
    }

    const existingMembership = await getMembershipByTeamAndUser({
      db: ctx.db,
      teamId: invitation.teamId,
      userId: identity.subject,
    });

    if (!existingMembership) {
      await ctx.db.insert("teamMembers", {
        teamId: invitation.teamId,
        userId: identity.subject,
        role: "seller",
        name: identity.name ?? undefined,
        email: identity.email ?? invitation.email,
        imageUrl: identity.pictureUrl ?? undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedByUserId: identity.subject,
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await upsertUserProfile({
      ctx,
      userId: identity.subject,
      activeTeamId: invitation.teamId,
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

export const getTeamManagementData = query({
  args: {},
  handler: async (ctx) => {
    const { membership, team } = await requireTeamMembership(ctx);
    const [members, invitations] = await Promise.all([
      ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
        .collect(),
      ctx.db
        .query("teamInvitations")
        .withIndex("by_team", (q) => q.eq("teamId", membership.teamId))
        .collect(),
    ]);

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
      invitations: invitations.sort((a, b) => b.createdAt - a.createdAt),
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

export const deleteTeam = mutation({
  args: {},
  handler: async (ctx) => {
    const { membership, team } = await requireTeamMembership(ctx);
    assertRole(membership, ["owner"]);

    const [
      calls,
      analyses,
      pendingAnalyses,
      analyticsSnapshots,
      feedbackSnapshots,
      notifications,
      invitations,
      members,
    ] = await Promise.all([
      ctx.db
        .query("calls")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect(),
      ctx.db
        .query("callAnalyses")
        .withIndex("by_team_created_at", (q) => q.eq("teamId", team._id))
        .collect(),
      ctx.db
        .query("pending_analysis")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect(),
      ctx.db
        .query("analytics")
        .withIndex("by_team_created_at", (q) => q.eq("teamId", team._id))
        .collect(),
      ctx.db
        .query("feedback")
        .withIndex("by_team_created_at", (q) => q.eq("teamId", team._id))
        .collect(),
      ctx.db
        .query("notifications")
        .withIndex("by_team_created_at", (q) => q.eq("teamId", team._id))
        .collect(),
      ctx.db
        .query("teamInvitations")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect(),
      ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect(),
    ]);

    for (const member of members) {
      await clearUserActiveTeamIfMatches({
        ctx,
        userId: member.userId,
        teamId: team._id,
      });
    }

    for (const analysis of analyses) {
      const transcriptEntries = await ctx.db
        .query("callTranscriptEntries")
        .withIndex("by_analysis", (q) => q.eq("callAnalysisId", analysis._id))
        .collect();

      for (const entry of transcriptEntries) {
        await ctx.db.delete(entry._id);
      }
    }

    for (const call of calls) {
      await ctx.storage.delete(call.sellerAudioStorageId);
      await ctx.storage.delete(call.clientAudioStorageId);
      await ctx.db.delete(call._id);
    }

    for (const analysis of analyses) {
      await ctx.db.delete(analysis._id);
    }
    for (const pending of pendingAnalyses) {
      await ctx.db.delete(pending._id);
    }
    for (const snapshot of analyticsSnapshots) {
      await ctx.db.delete(snapshot._id);
    }
    for (const snapshot of feedbackSnapshots) {
      await ctx.db.delete(snapshot._id);
    }
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
    for (const invitation of invitations) {
      await ctx.db.delete(invitation._id);
    }
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    await ctx.db.delete(team._id);
  },
});
