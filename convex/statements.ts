import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// User submits a statement
export const submit = mutation({
  args: {
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, { fileStorageId, fileName, fileType }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("No profile");

    const fileUrl = await ctx.storage.getUrl(fileStorageId);

    const id = await ctx.db.insert("statements", {
      userId,
      userName: profile.name,
      userEmail: profile.email,
      businessName: profile.businessName,
      fileStorageId,
      fileUrl: fileUrl ?? undefined,
      fileName,
      fileType,
      status: "pending",
      createdAt: Date.now(),
    });

    // Notify all admins
    const admins = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin.userId,
        type: "statement",
        title: "New Statement Upload",
        message: `${profile.name}${profile.businessName ? ` (${profile.businessName})` : ""} uploaded a processing statement for analysis.`,
        linkTo: "/admin",
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return id;
  },
});

// User: list own statements
export const myStatements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("statements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Admin: list all statements
export const listAll = query({
  args: { statusFilter: v.optional(v.string()) },
  handler: async (ctx, { statusFilter }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") return [];

    let statements;
    if (statusFilter && statusFilter !== "all") {
      statements = await ctx.db
        .query("statements")
        .withIndex("by_status", (q) => q.eq("status", statusFilter as any))
        .collect();
    } else {
      statements = await ctx.db.query("statements").collect();
    }

    return statements.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Admin: get single statement with file URL
export const get = query({
  args: { statementId: v.id("statements") },
  handler: async (ctx, { statementId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return null;

    const statement = await ctx.db.get(statementId);
    if (!statement) return null;

    // Users can see own, admins can see all
    if (profile.role !== "admin" && statement.userId !== userId) return null;

    // Get fresh file URL
    const fileUrl = await ctx.storage.getUrl(statement.fileStorageId);
    return { ...statement, fileUrl: fileUrl ?? statement.fileUrl };
  },
});

// Admin: update status
export const updateStatus = mutation({
  args: {
    statementId: v.id("statements"),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewing"),
      v.literal("analyzed"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, { statementId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admins only");

    await ctx.db.patch(statementId, {
      status,
      reviewedBy: profile.name,
      reviewedAt: Date.now(),
    });
  },
});

// Admin: save analysis data + comparison
export const saveAnalysis = mutation({
  args: {
    statementId: v.id("statements"),
    currentProcessor: v.optional(v.string()),
    monthlyVolume: v.optional(v.number()),
    monthlyTransactions: v.optional(v.number()),
    effectiveRate: v.optional(v.number()),
    monthlyFees: v.optional(v.number()),
    interchangeFees: v.optional(v.number()),
    assessmentFees: v.optional(v.number()),
    processorMarkup: v.optional(v.number()),
    monthlyServiceFee: v.optional(v.number()),
    pciFee: v.optional(v.number()),
    statementFee: v.optional(v.number()),
    batchFee: v.optional(v.number()),
    otherFees: v.optional(v.number()),
    csSavingsMonthly: v.optional(v.number()),
    csSavingsAnnual: v.optional(v.number()),
    csEffectiveRate: v.optional(v.number()),
    csMonthlyFees: v.optional(v.number()),
    csDonationMonthly: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admins only");

    const { statementId, ...data } = args;

    await ctx.db.patch(statementId, {
      ...data,
      status: "analyzed",
      reviewedBy: profile.name,
      reviewedAt: Date.now(),
    });

    // Notify the user
    const statement = await ctx.db.get(statementId);
    if (statement) {
      await ctx.db.insert("notifications", {
        userId: statement.userId,
        type: "statement_analyzed",
        title: "Statement Analysis Ready",
        message: `Your processing statement has been analyzed! Check your Statement Analyzer page for the comparison report.`,
        linkTo: "/statements",
        isRead: false,
        createdAt: Date.now(),
      });
    }
  },
});

// Admin: stats
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const all = await ctx.db.query("statements").collect();
    return {
      total: all.length,
      pending: all.filter((s) => s.status === "pending").length,
      reviewing: all.filter((s) => s.status === "reviewing").length,
      analyzed: all.filter((s) => s.status === "analyzed").length,
      rejected: all.filter((s) => s.status === "rejected").length,
    };
  },
});
