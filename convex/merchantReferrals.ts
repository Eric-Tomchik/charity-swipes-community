import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a unique merchant referral UID like "MR-AB12CD"
function generateMerchantUid(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let uid = "MR-";
  for (let i = 0; i < 6; i++) {
    uid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uid;
}

// ── Queries ──────────────────────────────────────────

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("merchantReferrals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const getByReferralUid = query({
  args: { referralUid: v.string() },
  handler: async (ctx, { referralUid }) => {
    return await ctx.db
      .query("merchantReferrals")
      .withIndex("by_referralUid", (q) => q.eq("referralUid", referralUid))
      .first();
  },
});

export const getReferrals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("merchantReferrals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return [];

    return await ctx.db
      .query("merchantReferralClicks")
      .withIndex("by_merchantReferralId", (q) =>
        q.eq("merchantReferralId", profile._id),
      )
      .collect();
  },
});

export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;

    const isAdmin = profile.role === "admin";

    const myRef = await ctx.db
      .query("merchantReferrals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Get clicks for this merchant (or all for admin)
    let clicks: any[];
    if (isAdmin) {
      clicks = await ctx.db.query("merchantReferralClicks").collect();
    } else if (myRef) {
      clicks = await ctx.db
        .query("merchantReferralClicks")
        .withIndex("by_merchantReferralId", (q) =>
          q.eq("merchantReferralId", myRef._id),
        )
        .collect();
    } else {
      clicks = [];
    }

    const now = Date.now();
    const weekMs = 7 * 86400000;
    const monthMs = 30 * 86400000;

    const totalClicked = clicks.filter((c) => c.status === "clicked").length;
    const totalSignedUp = clicks.filter((c) => c.status === "signed_up").length;
    const totalConverted = clicks.filter((c) => c.status === "converted").length;
    const total = clicks.length;

    const thisWeek = clicks.filter((c) => now - c.createdAt < weekMs);
    const thisMonth = clicks.filter((c) => now - c.createdAt < monthMs);

    const conversionRate =
      total > 0 ? Math.round((totalConverted / total) * 1000) / 10 : 0;

    // Weekly breakdown (last 4 weeks)
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = now - (i + 1) * weekMs;
      const weekEnd = now - i * weekMs;
      const weekClicks = clicks.filter(
        (c) => c.createdAt >= weekStart && c.createdAt < weekEnd,
      );
      weeklyData.push({
        label: i === 0 ? "This Week" : i === 1 ? "Last Week" : `${i}w ago`,
        clicks: weekClicks.filter((c) => c.status === "clicked").length,
        signups: weekClicks.filter((c) => c.status === "signed_up").length,
        conversions: weekClicks.filter((c) => c.status === "converted").length,
        total: weekClicks.length,
      });
    }

    // Admin: per-merchant breakdown
    let merchantBreakdown: any[] = [];
    if (isAdmin) {
      const allMerchants = await ctx.db.query("merchantReferrals").collect();
      merchantBreakdown = allMerchants
        .map((m) => {
          const mClicks = clicks.filter((c) => c.merchantReferralId === m._id);
          return {
            merchantId: m._id,
            referralUid: m.referralUid,
            name: m.name,
            businessName: m.businessName,
            email: m.email,
            isActive: m.isActive,
            totalReferrals: mClicks.length,
            clicks: mClicks.filter((c) => c.status === "clicked").length,
            signups: mClicks.filter((c) => c.status === "signed_up").length,
            conversions: mClicks.filter((c) => c.status === "converted").length,
          };
        })
        .sort((a, b) => b.conversions - a.conversions);
    }

    return {
      isAdmin,
      merchantProfile: myRef,
      funnel: {
        total,
        clicks: totalClicked,
        signups: totalSignedUp,
        converted: totalConverted,
        conversionRate,
      },
      periods: {
        thisWeekTotal: thisWeek.length,
        thisMonthTotal: thisMonth.length,
      },
      weeklyData,
      merchantBreakdown,
    };
  },
});

// ── Mutations ────────────────────────────────────────

// Create a merchant referral profile (called automatically when role→customer)
export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    businessName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("merchantReferrals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) return existing._id;

    // Generate unique UID
    let referralUid = generateMerchantUid();
    let attempts = 0;
    while (attempts < 10) {
      const dup = await ctx.db
        .query("merchantReferrals")
        .withIndex("by_referralUid", (q) => q.eq("referralUid", referralUid))
        .first();
      if (!dup) break;
      referralUid = generateMerchantUid();
      attempts++;
    }

    return await ctx.db.insert("merchantReferrals", {
      userId: args.userId,
      referralUid,
      name: args.name,
      email: args.email,
      businessName: args.businessName,
      totalReferrals: 0,
      totalSignups: 0,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Track when someone clicks a merchant's referral link
export const trackClick = mutation({
  args: { referralUid: v.string() },
  handler: async (ctx, { referralUid }) => {
    const merchant = await ctx.db
      .query("merchantReferrals")
      .withIndex("by_referralUid", (q) => q.eq("referralUid", referralUid))
      .first();
    if (!merchant) return;

    await ctx.db.insert("merchantReferralClicks", {
      merchantReferralId: merchant._id,
      referralUid,
      status: "clicked",
      createdAt: Date.now(),
    });

    await ctx.db.patch(merchant._id, {
      totalReferrals: merchant.totalReferrals + 1,
    });
  },
});

// Update click status (e.g., when prospect signs up or converts)
export const updateClickStatus = mutation({
  args: {
    prospectUserId: v.string(),
    status: v.union(
      v.literal("signed_up"),
      v.literal("converted"),
    ),
    prospectName: v.optional(v.string()),
    prospectEmail: v.optional(v.string()),
    businessName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the most recent click for this prospect
    const click = await ctx.db
      .query("merchantReferralClicks")
      .withIndex("by_prospectUserId", (q) =>
        q.eq("prospectUserId", args.prospectUserId),
      )
      .first();
    if (!click) return;

    const patch: any = { status: args.status };
    if (args.prospectName) patch.prospectName = args.prospectName;
    if (args.prospectEmail) patch.prospectEmail = args.prospectEmail;
    if (args.businessName) patch.businessName = args.businessName;
    if (args.status === "converted") patch.convertedAt = Date.now();

    await ctx.db.patch(click._id, patch);

    // Update merchant counters
    const merchant = await ctx.db.get(click.merchantReferralId);
    if (merchant && args.status === "signed_up") {
      await ctx.db.patch(merchant._id, {
        totalSignups: merchant.totalSignups + 1,
      });
    }
  },
});

// Admin: list all merchant referral profiles
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") return [];

    return await ctx.db.query("merchantReferrals").collect();
  },
});
