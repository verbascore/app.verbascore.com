import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertTeamAccess, requireTeamMembership } from "./lib/teamAccess";

function normalizeEmail(email?: string) {
  const value = email?.trim().toLowerCase();
  return value ? value : undefined;
}

function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "");
}

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const { membership, team } = await requireTeamMembership(ctx);

    const [contacts, organizations, activities, connections] = await Promise.all([
      ctx.db
        .query("crmContacts")
        .withIndex("by_team_updated_at", (q) => q.eq("teamId", team._id))
        .order("desc")
        .take(50),
      ctx.db
        .query("crmOrganizations")
        .withIndex("by_team_updated_at", (q) => q.eq("teamId", team._id))
        .order("desc")
        .take(12),
      ctx.db
        .query("crmActivities")
        .withIndex("by_team_created_at", (q) => q.eq("teamId", team._id))
        .order("desc")
        .take(16),
      ctx.db
        .query("crmSyncConnections")
        .withIndex("by_team_updated_at", (q) => q.eq("teamId", team._id))
        .order("desc")
        .collect(),
    ]);

    const relatedOrganizations = await Promise.all(
      [...new Set(contacts.map((contact) => contact.organizationId).filter(Boolean))].map(
        (organizationId) => ctx.db.get(organizationId!),
      ),
    );
    const organizationsById = new Map(
      relatedOrganizations
        .filter((organization): organization is NonNullable<typeof organization> =>
          Boolean(organization),
        )
        .map((organization) => [organization._id, organization]),
    );

    const contactCount = (
      await ctx.db
        .query("crmContacts")
        .withIndex("by_team_updated_at", (q) => q.eq("teamId", team._id))
        .collect()
    ).length;
    const organizationCount = (
      await ctx.db
        .query("crmOrganizations")
        .withIndex("by_team_updated_at", (q) => q.eq("teamId", team._id))
        .collect()
    ).length;

    const withEmailCount = contacts.filter((contact) => Boolean(contact.email)).length;
    const activeCustomersCount = contacts.filter(
      (contact) => contact.lifecycleStage === "customer",
    ).length;

    return {
      team,
      membership,
      stats: {
        contactCount,
        organizationCount,
        withEmailCount,
        activeCustomersCount,
        connectionCount: connections.length,
      },
      contacts: contacts.map((contact) => ({
        ...contact,
        organization: contact.organizationId
          ? organizationsById.get(contact.organizationId) ?? null
          : null,
      })),
      organizations,
      activities,
      connections,
    };
  },
});

export const createContact = mutation({
  args: {
    fullName: v.string(),
    phoneNumber: v.string(),
    email: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    organizationId: v.optional(v.id("crmOrganizations")),
    organizationName: v.optional(v.string()),
    notes: v.optional(v.string()),
    lifecycleStage: v.optional(
      v.union(
        v.literal("lead"),
        v.literal("contacted"),
        v.literal("qualified"),
        v.literal("customer"),
        v.literal("inactive"),
      ),
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { membership, team } = await requireTeamMembership(ctx);
    const fullName = args.fullName.trim();
    const phoneNumber = args.phoneNumber.trim();

    if (!fullName) {
      throw new ConvexError("Contact name is required.");
    }

    if (!phoneNumber) {
      throw new ConvexError("Phone number is required.");
    }

    let organizationId = args.organizationId;

    if (!organizationId && args.organizationName?.trim()) {
      organizationId = await ctx.db.insert("crmOrganizations", {
        teamId: team._id,
        name: args.organizationName.trim(),
        lifecycleStage: "lead",
        createdByUserId: membership.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (organizationId) {
      const organization = await ctx.db.get(organizationId);

      if (!organization) {
        throw new ConvexError("Organization not found.");
      }

      assertTeamAccess({ membership, teamId: organization.teamId });
    }

    const now = Date.now();
    const [firstName, ...restNameParts] = fullName.split(" ");
    const lastName = restNameParts.join(" ").trim();
    const contactId = await ctx.db.insert("crmContacts", {
      teamId: team._id,
      organizationId,
      fullName,
      firstName: firstName?.trim() || undefined,
      lastName: lastName || undefined,
      jobTitle: args.jobTitle?.trim() || undefined,
      email: args.email?.trim() || undefined,
      normalizedEmail: normalizeEmail(args.email),
      phoneNumber,
      normalizedPhoneNumber: normalizePhoneNumber(phoneNumber),
      lifecycleStage: args.lifecycleStage ?? "lead",
      source: "manual",
      notes: args.notes?.trim() || undefined,
      tags: (args.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
      createdByUserId: membership.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("crmActivities", {
      teamId: team._id,
      contactId,
      organizationId,
      kind: "note",
      summary: "Contact created in VerbaScore CRM",
      details: args.notes?.trim() || undefined,
      createdByUserId: membership.userId,
      createdAt: now,
      updatedAt: now,
    });

    return contactId;
  },
});

export const updateContact = mutation({
  args: {
    contactId: v.id("crmContacts"),
    fullName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    notes: v.optional(v.string()),
    lifecycleStage: v.optional(
      v.union(
        v.literal("lead"),
        v.literal("contacted"),
        v.literal("qualified"),
        v.literal("customer"),
        v.literal("inactive"),
      ),
    ),
    tags: v.optional(v.array(v.string())),
    lastContactedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireTeamMembership(ctx);
    const contact = await ctx.db.get(args.contactId);

    if (!contact) {
      throw new ConvexError("Contact not found.");
    }

    assertTeamAccess({ membership, teamId: contact.teamId });

    await ctx.db.patch(args.contactId, {
      fullName: args.fullName?.trim() || contact.fullName,
      phoneNumber: args.phoneNumber?.trim() || contact.phoneNumber,
      normalizedPhoneNumber: args.phoneNumber
        ? normalizePhoneNumber(args.phoneNumber)
        : contact.normalizedPhoneNumber,
      email: args.email?.trim() || undefined,
      normalizedEmail:
        args.email !== undefined ? normalizeEmail(args.email) : contact.normalizedEmail,
      jobTitle: args.jobTitle?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      lifecycleStage: args.lifecycleStage ?? contact.lifecycleStage,
      tags:
        args.tags?.map((tag) => tag.trim()).filter(Boolean) ?? contact.tags,
      lastContactedAt: args.lastContactedAt ?? contact.lastContactedAt,
      updatedAt: Date.now(),
    });
  },
});

export const addActivity = mutation({
  args: {
    contactId: v.optional(v.id("crmContacts")),
    organizationId: v.optional(v.id("crmOrganizations")),
    kind: v.union(
      v.literal("note"),
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("sync"),
    ),
    summary: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { membership, team } = await requireTeamMembership(ctx);

    if (!args.contactId && !args.organizationId) {
      throw new ConvexError("An activity must belong to a contact or organization.");
    }

    if (args.contactId) {
      const contact = await ctx.db.get(args.contactId);
      if (!contact) {
        throw new ConvexError("Contact not found.");
      }
      assertTeamAccess({ membership, teamId: contact.teamId });
    }

    if (args.organizationId) {
      const organization = await ctx.db.get(args.organizationId);
      if (!organization) {
        throw new ConvexError("Organization not found.");
      }
      assertTeamAccess({ membership, teamId: organization.teamId });
    }

    const now = Date.now();
    return await ctx.db.insert("crmActivities", {
      teamId: team._id,
      contactId: args.contactId,
      organizationId: args.organizationId,
      kind: args.kind,
      summary: args.summary.trim(),
      details: args.details?.trim() || undefined,
      createdByUserId: membership.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});
