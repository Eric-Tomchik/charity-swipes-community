import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Default settings
const DEFAULTS: Record<string, string> = {
  communityName: "Charity Swipes Community",
  communityDescription: "Connect with fellow merchants, get 24/7 support, and see the real impact of every card swipe.",
  welcomeMessage: "Welcome to the Charity Swipes Community! We're glad you're here.",
  primaryColor: "#ec4899",
  allowPublicSignup: "true",
  requireApproval: "true",
  allowProspectChannelView: "true",
  maxFileUploadMb: "5",
  maintenanceMode: "false",
  charityGiveBackRate: "0.5",
};

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("communitySettings").collect();
    // Merge with defaults
    const result: Record<string, string> = { ...DEFAULTS };
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  },
});

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const setting = await ctx.db
      .query("communitySettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return setting?.value ?? DEFAULTS[key] ?? null;
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Admin check
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admin only");

    const existing = await ctx.db
      .query("communitySettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    } else {
      await ctx.db.insert("communitySettings", {
        key,
        value,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }
  },
});

export const setBatch = mutation({
  args: { settings: v.array(v.object({ key: v.string(), value: v.string() })) },
  handler: async (ctx, { settings }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admin only");

    for (const { key, value } of settings) {
      const existing = await ctx.db
        .query("communitySettings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value,
          updatedAt: Date.now(),
          updatedBy: userId,
        });
      } else {
        await ctx.db.insert("communitySettings", {
          key,
          value,
          updatedAt: Date.now(),
          updatedBy: userId,
        });
      }
    }
  },
});

// Internal query for use by other backend functions (no auth required)
export const internalGet = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const setting = await ctx.db
      .query("communitySettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return setting?.value ?? DEFAULTS[key] ?? null;
  },
});

// Internal mutation to set a setting (no auth required - for system use)
export const internalSet = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query("communitySettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: Date.now(),
        updatedBy: "system",
      });
    } else {
      await ctx.db.insert("communitySettings", {
        key,
        value,
        updatedAt: Date.now(),
        updatedBy: "system",
      });
    }
  },
});
