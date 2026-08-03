import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateRepUid(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let uid = "CS-";
  for (let i = 0; i < 6; i++) {
    uid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uid;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const reps = await ctx.db.query("salesReps").collect();
    return reps.sort((a, b) => b.totalReferrals - a.totalReferrals);
  },
});

export const getMyRepProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("salesReps")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const getByRepUid = query({
  args: { repUid: v.string() },
  handler: async (ctx, { repUid }) => {
    return await ctx.db
      .query("salesReps")
      .withIndex("by_repUid", (q) => q.eq("repUid", repUid))
      .first();
  },
});

export const create = mutation({
  args: { userId: v.string(), name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUserId(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", currentUser))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admin only");

    const existing = await ctx.db
      .query("salesReps")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) return existing._id;

    let repUid = generateRepUid();
    let attempts = 0;
    while (attempts < 10) {
      const dup = await ctx.db
        .query("salesReps")
        .withIndex("by_repUid", (q) => q.eq("repUid", repUid))
        .first();
      if (!dup) break;
      repUid = generateRepUid();
      attempts++;
    }

    return await ctx.db.insert("salesReps", {
      userId: args.userId,
      repUid,
      name: args.name,
      email: args.email,
      totalReferrals: 0,
      totalSignups: 0,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const getReferrals = query({
  args: { salesRepId: v.optional(v.id("salesReps")) },
  handler: async (ctx, { salesRepId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (salesRepId) {
      return await ctx.db
        .query("referrals")
        .withIndex("by_salesRepId", (q) => q.eq("salesRepId", salesRepId))
        .collect();
    }

    const rep = await ctx.db
      .query("salesReps")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!rep) return [];
    return await ctx.db
      .query("referrals")
      .withIndex("by_salesRepId", (q) => q.eq("salesRepId", rep._id))
      .collect();
  },
});

// Analytics: get conversion funnel stats for a rep or all reps
export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const isAdmin = profile?.role === "admin";

    // Get rep profile for current user (may be null)
    const myRep = await ctx.db
      .query("salesReps")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Get referrals for this rep or all referrals for admin
    let referrals: Array<{
      _id: string;
      salesRepId: string;
      repUid: string;
      status: string;
      createdAt: number;
      prospectName?: string;
      prospectEmail?: string;
      businessName?: string;
      convertedAt?: number;
      prospectUserId?: string;
    }>;
    if (isAdmin) {
      referrals = await ctx.db.query("referrals").collect() as any;
    } else if (myRep) {
      referrals = await ctx.db
        .query("referrals")
        .withIndex("by_salesRepId", (q) => q.eq("salesRepId", myRep._id))
        .collect() as any;
    } else {
      referrals = [];
    }

    const now = Date.now();
    const dayMs = 86400000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    const totalClicks = referrals.filter((r) => r.status === "clicked").length;
    const totalSignups = referrals.filter((r) => r.status === "signed_up").length;
    const totalConverted = referrals.filter((r) => r.status === "converted").length;
    const total = referrals.length;

    const thisWeek = referrals.filter((r) => now - r.createdAt < weekMs);
    const thisMonth = referrals.filter((r) => now - r.createdAt < monthMs);
    const lastMonth = referrals.filter(
      (r) => now - r.createdAt >= monthMs && now - r.createdAt < 2 * monthMs
    );

    // Conversion rate: converted / total (or converted / signups if you prefer)
    const clickToSignup = total > 0 ? ((totalSignups + totalConverted) / total) * 100 : 0;
    const signupToConvert = (totalSignups + totalConverted) > 0
      ? (totalConverted / (totalSignups + totalConverted)) * 100
      : 0;
    const overallConversion = total > 0 ? (totalConverted / total) * 100 : 0;

    // Weekly breakdown (last 8 weeks)
    const weeklyData = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = now - (i + 1) * weekMs;
      const weekEnd = now - i * weekMs;
      const weekRefs = referrals.filter((r) => r.createdAt >= weekStart && r.createdAt < weekEnd);
      const weekLabel = i === 0 ? "This Week" : i === 1 ? "Last Week" : `${i}w ago`;
      weeklyData.push({
        label: weekLabel,
        clicks: weekRefs.filter((r) => r.status === "clicked").length,
        signups: weekRefs.filter((r) => r.status === "signed_up").length,
        conversions: weekRefs.filter((r) => r.status === "converted").length,
        total: weekRefs.length,
      });
    }

    // Per-rep breakdown (admin only)
    let repBreakdown: Array<{
      repId: string;
      repUid: string;
      name: string;
      email: string;
      isActive: boolean;
      totalReferrals: number;
      clicks: number;
      signups: number;
      conversions: number;
      conversionRate: number;
    }> = [];

    if (isAdmin) {
      const allReps = await ctx.db.query("salesReps").collect();
      repBreakdown = allReps.map((rep) => {
        const repRefs = referrals.filter((r) => r.salesRepId === rep._id);
        const clicks = repRefs.filter((r) => r.status === "clicked").length;
        const signups = repRefs.filter((r) => r.status === "signed_up").length;
        const conversions = repRefs.filter((r) => r.status === "converted").length;
        return {
          repId: rep._id,
          repUid: rep.repUid,
          name: rep.name,
          email: rep.email,
          isActive: rep.isActive,
          totalReferrals: repRefs.length,
          clicks,
          signups,
          conversions,
          conversionRate: repRefs.length > 0 ? (conversions / repRefs.length) * 100 : 0,
        };
      }).sort((a, b) => b.conversions - a.conversions);
    }

    return {
      isAdmin,
      repProfile: myRep,
      funnel: {
        total,
        clicks: totalClicks,
        signups: totalSignups,
        converted: totalConverted,
        clickToSignup: Math.round(clickToSignup * 10) / 10,
        signupToConvert: Math.round(signupToConvert * 10) / 10,
        overallConversion: Math.round(overallConversion * 10) / 10,
      },
      periods: {
        thisWeekTotal: thisWeek.length,
        thisMonthTotal: thisMonth.length,
        lastMonthTotal: lastMonth.length,
        monthOverMonth: lastMonth.length > 0
          ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100)
          : thisMonth.length > 0 ? 100 : 0,
      },
      weeklyData,
      repBreakdown,
    };
  },
});

export const toggleActive = mutation({
  args: { repId: v.id("salesReps"), isActive: v.boolean() },
  handler: async (ctx, { repId, isActive }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admin only");
    await ctx.db.patch(repId, { isActive });
  },
});

export const remove = mutation({
  args: { repId: v.id("salesReps") },
  handler: async (ctx, { repId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admin only");

    // Also revert user profile role
    const rep = await ctx.db.get(repId);
    if (rep) {
      const repProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", rep.userId))
        .first();
      if (repProfile && repProfile.role === "sales_rep") {
        await ctx.db.patch(repProfile._id, { role: "customer" });
      }
    }
    await ctx.db.delete(repId);
  },
});

export const trackReferralClick = mutation({
  args: { repUid: v.string() },
  handler: async (ctx, { repUid }) => {
    const rep = await ctx.db
      .query("salesReps")
      .withIndex("by_repUid", (q) => q.eq("repUid", repUid))
      .first();
    if (!rep) return;

    await ctx.db.insert("referrals", {
      salesRepId: rep._id,
      repUid,
      status: "clicked",
      createdAt: Date.now(),
    });

    await ctx.db.patch(rep._id, {
      totalReferrals: rep.totalReferrals + 1,
    });
  },
});

export const getAllReferrals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("referrals").collect();
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("salesReps").first();
    if (existing) return "already seeded";

    const repId = await ctx.db.insert("salesReps", {
      userId: "seed-rep-1",
      repUid: "CS-DEMO01",
      name: "Sarah Johnson",
      email: "sarah@charityswipes.com",
      totalReferrals: 12,
      totalSignups: 5,
      isActive: true,
      createdAt: Date.now() - 2592000000,
    });

    const now = Date.now();
    const referrals = [
      { prospectName: "Mike's Auto Shop", prospectEmail: "mike@autoshop.com", status: "converted" as const, businessName: "Mike's Auto Shop", offset: -604800000, convertedAt: now - 172800000 },
      { prospectName: "Fresh Bites Deli", prospectEmail: "info@freshbites.com", status: "signed_up" as const, businessName: "Fresh Bites Deli", offset: -259200000 },
      { prospectName: "Sunny Day Florist", status: "clicked" as const, offset: -86400000 },
      { prospectName: "Joe's Pizza", prospectEmail: "joe@joespizza.com", status: "converted" as const, businessName: "Joe's Pizza", offset: -1209600000, convertedAt: now - 864000000 },
      { prospectName: "Green Thumb Garden", prospectEmail: "hello@greenthumb.com", status: "signed_up" as const, businessName: "Green Thumb Garden", offset: -432000000 },
      { prospectName: "City Barber", status: "clicked" as const, offset: -345600000 },
      { prospectName: "Ace Hardware Local", prospectEmail: "ace@local.com", status: "signed_up" as const, businessName: "Ace Hardware Local", offset: -518400000 },
      { prospectName: "Quick Lube Plus", status: "clicked" as const, offset: -172800000 },
      { prospectName: "Bella Salon", prospectEmail: "bella@bellasalon.com", status: "converted" as const, businessName: "Bella Salon", offset: -1814400000, convertedAt: now - 1296000000 },
      { prospectName: "Downtown Diner", prospectEmail: "info@downtowndiner.com", status: "signed_up" as const, businessName: "Downtown Diner", offset: -691200000 },
      { prospectName: "Peak Fitness", status: "clicked" as const, offset: -50000000 },
      { prospectName: "Corner Bookshop", prospectEmail: "books@corner.com", status: "clicked" as const, offset: -120000000 },
    ];

    for (const r of referrals) {
      await ctx.db.insert("referrals", {
        salesRepId: repId,
        repUid: "CS-DEMO01",
        prospectName: r.prospectName,
        prospectEmail: r.prospectEmail,
        prospectUserId: undefined,
        status: r.status,
        businessName: r.businessName,
        createdAt: now + r.offset,
        convertedAt: r.convertedAt,
      });
    }

    return "seeded";
  },
});
