import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Admin emails get auto-promoted
const ADMIN_EMAILS = ["eric@charityswipes.com", "admin@charityswipes.com"];

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return profile;
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    businessName: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("customer"),
        v.literal("prospect"),
        v.literal("sales_rep"),
      ),
    ),
    referredByRepId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) return existing._id;

    // Auto-admin for charityswipes.com emails
    let role = args.role ?? "prospect";
    if (ADMIN_EMAILS.includes(args.email.toLowerCase())) {
      role = "admin";
    }

    // If referred by a sales rep, track it
    if (args.referredByRepId) {
      const repUid = args.referredByRepId;
      const rep = await ctx.db
        .query("salesReps")
        .withIndex("by_repUid", (q) => q.eq("repUid", repUid))
        .first();
      if (rep) {
        await ctx.db.insert("referrals", {
          salesRepId: rep._id,
          repUid: rep.repUid,
          prospectName: args.name,
          prospectEmail: args.email,
          prospectUserId: userId,
          status: "signed_up",
          createdAt: Date.now(),
        });
        await ctx.db.patch(rep._id, {
          totalSignups: rep.totalSignups + 1,
        });
      }
    }

    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      name: args.name,
      email: args.email,
      businessName: args.businessName,
      phone: args.phone,
      role,
      referredByRepId: args.referredByRepId,
      notifyEmail: true,
      notifyTickets: true,
      notifyAnnouncements: true,
      notifyMessages: true,
      joinedAt: Date.now(),
    });

    // Notify all admins about new signup
    if (role !== "admin") {
      const admins = await ctx.db
        .query("userProfiles")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .collect();
      for (const admin of admins) {
        await ctx.db.insert("notifications", {
          userId: admin.userId,
          type: "new_signup",
          title: "New User Signed Up",
          message: `${args.name} (${args.email}) just created an account${args.businessName ? ` — ${args.businessName}` : ""}.`,
          isRead: false,
          linkTo: "/admin",
          createdAt: Date.now(),
        });
      }
    }

    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    businessName: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    notifyEmail: v.optional(v.boolean()),
    notifyTickets: v.optional(v.boolean()),
    notifyAnnouncements: v.optional(v.boolean()),
    notifyMessages: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found");

    const updates: Record<string, any> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.businessName !== undefined) updates.businessName = args.businessName;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.website !== undefined) updates.website = args.website;
    if (args.profileImageUrl !== undefined) updates.profileImageUrl = args.profileImageUrl;
    if (args.notifyEmail !== undefined) updates.notifyEmail = args.notifyEmail;
    if (args.notifyTickets !== undefined) updates.notifyTickets = args.notifyTickets;
    if (args.notifyAnnouncements !== undefined) updates.notifyAnnouncements = args.notifyAnnouncements;
    if (args.notifyMessages !== undefined) updates.notifyMessages = args.notifyMessages;

    await ctx.db.patch(profile._id, updates);
  },
});

export const updateRole = mutation({
  args: {
    profileId: v.id("userProfiles"),
    role: v.union(
      v.literal("admin"),
      v.literal("customer"),
      v.literal("prospect"),
      v.literal("sales_rep"),
    ),
  },
  handler: async (ctx, { profileId, role }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!admin || admin.role !== "admin") throw new Error("Admin only");

    await ctx.db.patch(profileId, { role });

    if (role === "customer") {
      const profile = await ctx.db.get(profileId);
      if (profile) {
        // Mark sales rep referral as converted
        const referral = await ctx.db
          .query("referrals")
          .withIndex("by_prospectUserId", (q) =>
            q.eq("prospectUserId", profile.userId),
          )
          .first();
        if (referral && referral.status !== "converted") {
          await ctx.db.patch(referral._id, {
            status: "converted",
            convertedAt: Date.now(),
          });
        }

        // Also mark merchant referral click as converted
        const mrefClick = await ctx.db
          .query("merchantReferralClicks")
          .withIndex("by_prospectUserId", (q) =>
            q.eq("prospectUserId", profile.userId),
          )
          .first();
        if (mrefClick && mrefClick.status !== "converted") {
          await ctx.db.patch(mrefClick._id, {
            status: "converted",
            convertedAt: Date.now(),
          });
        }

        // Auto-create merchant referral profile for newly verified merchant
        const existingMref = await ctx.db
          .query("merchantReferrals")
          .withIndex("by_userId", (q) => q.eq("userId", profile.userId))
          .first();
        if (!existingMref) {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let uid = "MR-";
          for (let i = 0; i < 6; i++) {
            uid += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          // Ensure unique
          let dup = await ctx.db
            .query("merchantReferrals")
            .withIndex("by_referralUid", (q) => q.eq("referralUid", uid))
            .first();
          let attempts = 0;
          while (dup && attempts < 10) {
            uid = "MR-";
            for (let i = 0; i < 6; i++) {
              uid += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            dup = await ctx.db
              .query("merchantReferrals")
              .withIndex("by_referralUid", (q) => q.eq("referralUid", uid))
              .first();
            attempts++;
          }

          await ctx.db.insert("merchantReferrals", {
            userId: profile.userId,
            referralUid: uid,
            name: profile.name,
            email: profile.email,
            businessName: profile.businessName,
            totalReferrals: 0,
            totalSignups: 0,
            isActive: true,
            createdAt: Date.now(),
          });
        }
      }
    }
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userProfiles").collect();
  },
});

export const listByRole = query({
  args: {
    role: v.union(
      v.literal("admin"),
      v.literal("customer"),
      v.literal("prospect"),
      v.literal("sales_rep"),
    ),
  },
  handler: async (ctx, { role }) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", role))
      .collect();
  },
});

// Accept Terms of Service
export const acceptTos = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { tosAcceptedAt: Date.now() });
  },
});

// Admin: Set account status (suspend, probation, remove, active)
export const setAccountStatus = mutation({
  args: {
    profileId: v.id("userProfiles"),
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("probation"),
      v.literal("removed"),
    ),
    reason: v.optional(v.string()),
    probationDays: v.optional(v.number()),
  },
  handler: async (ctx, { profileId, status, reason, probationDays }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const admin = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!admin || admin.role !== "admin") throw new Error("Admin only");

    const updates: Record<string, any> = { accountStatus: status };
    if (status === "suspended" || status === "removed") {
      updates.suspendedReason = reason || "";
      updates.suspendedAt = Date.now();
    }
    if (status === "probation" && probationDays) {
      updates.probationUntil = Date.now() + probationDays * 86400000;
      updates.suspendedReason = reason || "";
    }
    if (status === "active") {
      updates.suspendedReason = undefined;
      updates.suspendedAt = undefined;
      updates.probationUntil = undefined;
    }

    await ctx.db.patch(profileId, updates);
  },
});
