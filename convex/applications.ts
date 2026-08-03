import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const apps = await ctx.db.query("applications").collect();
    return apps.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("applications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const create = mutation({
  args: {
    accountType: v.string(),
    businessName: v.string(),
    businessType: v.optional(v.string()),
    businessAddress: v.optional(v.string()),
    currentProcessor: v.optional(v.string()),
    monthlyVolume: v.optional(v.string()),
    acceptsCards: v.optional(v.boolean()),
    merchantId: v.optional(v.string()),
    howHeard: v.optional(v.string()),
    charityInterest: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("No profile");

    const existing = await ctx.db
      .query("applications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) throw new Error("Already applied");

    const appId = await ctx.db.insert("applications", {
      userId,
      userName: profile.name,
      userEmail: profile.email,
      accountType: args.accountType,
      businessName: args.businessName,
      businessType: args.businessType,
      businessAddress: args.businessAddress,
      currentProcessor: args.currentProcessor,
      monthlyVolume: args.monthlyVolume,
      acceptsCards: args.acceptsCards,
      merchantId: args.merchantId,
      howHeard: args.howHeard,
      charityInterest: args.charityInterest,
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    });

    // Notify all admins about new application
    const admins = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin.userId,
        type: "new_application",
        title: "New Application Submitted",
        message: `${profile.name} submitted a ${args.accountType} application for ${args.businessName}.`,
        isRead: false,
        linkTo: "/admin",
        createdAt: Date.now(),
      });
    }

    return appId;
  },
});

export const updateStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, { applicationId, status, reviewNote }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Not found");

    await ctx.db.patch(applicationId, { status, reviewedBy: userId, reviewNote });

    // If approved, upgrade user role to customer and auto-create merchant referral
    if (status === "approved") {
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", app.userId))
        .first();
      if (profile && profile.role === "prospect") {
        await ctx.db.patch(profile._id, { role: "customer" });

        // Auto-create merchant referral profile
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
            businessName: profile.businessName || app.businessName,
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
