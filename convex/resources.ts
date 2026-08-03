import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const categoryValidator = v.union(
  v.literal("clover_guides"),
  v.literal("cash_discount"),
  v.literal("compliance_legal"),
  v.literal("industry_news"),
  v.literal("technical"),
  v.literal("general"),
);

/* ─── List resources (all users) ─── */
export const list = query({
  args: {
    category: v.optional(categoryValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let resources;
    if (args.category) {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      resources = await ctx.db.query("resources").collect();
    }

    // Generate download URLs
    const withUrls = await Promise.all(
      resources.map(async (r) => {
        const url = await ctx.storage.getUrl(r.fileStorageId);
        return { ...r, fileUrl: url };
      }),
    );

    // Sort: pinned first, then by createdAt desc
    return withUrls.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  },
});

/* ─── Generate upload URL (admin only) ─── */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || profile.role !== "admin")
      throw new Error("Admin only");
    return await ctx.storage.generateUploadUrl();
  },
});

/* ─── Create resource (admin only) ─── */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: categoryValidator,
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || profile.role !== "admin")
      throw new Error("Admin only");

    return await ctx.db.insert("resources", {
      title: args.title,
      description: args.description,
      category: args.category,
      fileStorageId: args.fileStorageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      downloadCount: 0,
      isPinned: false,
      uploadedBy: userId,
      uploadedByName: profile.name,
      createdAt: Date.now(),
    });
  },
});

/* ─── Update resource (admin only) ─── */
export const update = mutation({
  args: {
    id: v.id("resources"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(categoryValidator),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || profile.role !== "admin")
      throw new Error("Admin only");

    const { id, ...fields } = args;
    // Remove undefined fields
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(id, patch);
  },
});

/* ─── Delete resource (admin only) ─── */
export const remove = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || profile.role !== "admin")
      throw new Error("Admin only");

    const resource = await ctx.db.get(args.id);
    if (resource) {
      await ctx.storage.delete(resource.fileStorageId);
      await ctx.db.delete(args.id);
    }
  },
});

/* ─── Track download (any authenticated user) ─── */
export const trackDownload = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const resource = await ctx.db.get(args.id);
    if (resource) {
      await ctx.db.patch(args.id, {
        downloadCount: resource.downloadCount + 1,
      });
    }
  },
});
