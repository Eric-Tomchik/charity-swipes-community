import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("charityStats").first();
    return stats ?? { totalDonated: 0, totalTransactions: 0, activeCharities: 0, lastUpdated: Date.now() };
  },
});

export const listCharities = query({
  args: {},
  handler: async (ctx) => {
    const charities = await ctx.db.query("charities").collect();
    return charities.sort((a, b) => b.totalVotes - a.totalVotes);
  },
});

export const vote = mutation({
  args: { charityId: v.id("charities") },
  handler: async (ctx, { charityId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("charityVotes")
      .withIndex("by_userId_charityId", (q) =>
        q.eq("userId", userId).eq("charityId", charityId),
      )
      .first();
    if (existing) throw new Error("Already voted");

    await ctx.db.insert("charityVotes", {
      userId,
      charityId,
      createdAt: Date.now(),
    });

    const charity = await ctx.db.get(charityId);
    if (charity) {
      await ctx.db.patch(charityId, { totalVotes: charity.totalVotes + 1 });
    }
  },
});

export const getUserVotes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const votes = await ctx.db
      .query("charityVotes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return votes.map((v) => v.charityId);
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("charities").first();
    if (existing) return "already seeded";

    await ctx.db.insert("charityStats", {
      totalDonated: 42750,
      totalTransactions: 156420,
      activeCharities: 6,
      lastUpdated: Date.now(),
    });

    const charities = [
      { name: "St. Jude Children's Research Hospital", description: "Leading the way the world understands, treats, and defeats childhood cancer and other life-threatening diseases.", category: "Healthcare", imageEmoji: "🏥", totalVotes: 89, totalDonated: 12400, isActive: true },
      { name: "Feeding America", description: "The nation's largest domestic hunger-relief organization, providing meals to those facing hunger.", category: "Hunger Relief", imageEmoji: "🍽️", totalVotes: 67, totalDonated: 8950, isActive: true },
      { name: "Habitat for Humanity", description: "Building strength, stability and self-reliance through shelter. Helping families build and improve their homes.", category: "Housing", imageEmoji: "🏠", totalVotes: 54, totalDonated: 7200, isActive: true },
      { name: "American Red Cross", description: "Providing disaster relief, blood donations, health and safety training, and support for military families.", category: "Disaster Relief", imageEmoji: "🏥", totalVotes: 46, totalDonated: 6100, isActive: true },
      { name: "Local Animal Shelter Alliance", description: "Supporting local animal shelters with funding for veterinary care, food, and adoption programs.", category: "Animal Welfare", imageEmoji: "🐾", totalVotes: 38, totalDonated: 4800, isActive: true },
      { name: "Boys & Girls Clubs of America", description: "Enabling young people to reach their full potential as productive, caring, responsible citizens.", category: "Youth Development", imageEmoji: "👦", totalVotes: 31, totalDonated: 3300, isActive: true },
    ];

    for (const c of charities) {
      await ctx.db.insert("charities", c);
    }
    return "seeded";
  },
});
