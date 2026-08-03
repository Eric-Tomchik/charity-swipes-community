import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const channels = await ctx.db.query("channels").collect();
    return channels.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    isPublic: v.boolean(),
    allowProspectView: v.boolean(),
    category: v.union(v.literal("public"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    // Check slug uniqueness
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error("A channel with this slug already exists");

    // Get next sort order
    const channels = await ctx.db.query("channels").collect();
    const maxSort = channels.reduce((max, ch) => Math.max(max, ch.sortOrder), 0);

    return await ctx.db.insert("channels", {
      ...args,
      sortOrder: maxSort + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("channels"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    allowProspectView: v.optional(v.boolean()),
    category: v.optional(v.union(v.literal("public"), v.literal("member"))),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const channel = await ctx.db.get(id);
    if (!channel) throw new Error("Channel not found");

    // If slug is being changed, check uniqueness
    if (updates.slug && updates.slug !== channel.slug) {
      const existing = await ctx.db
        .query("channels")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
        .first();
      if (existing) throw new Error("A channel with this slug already exists");
    }

    // Filter out undefined values
    const patch: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("channels"),
    deletePosts: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, deletePosts }) => {
    const channel = await ctx.db.get(id);
    if (!channel) throw new Error("Channel not found");

    // Delete associated posts if requested
    if (deletePosts) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_channelId", (q) => q.eq("channelId", id))
        .collect();
      for (const post of posts) {
        await ctx.db.delete(post._id);
      }
    }

    await ctx.db.delete(id);
    return { deleted: channel.name, postsRemoved: deletePosts ? true : false };
  },
});

export const reorder = mutation({
  args: {
    channelIds: v.array(v.id("channels")),
  },
  handler: async (ctx, { channelIds }) => {
    for (let i = 0; i < channelIds.length; i++) {
      await ctx.db.patch(channelIds[i], { sortOrder: i + 1 });
    }
    return "reordered";
  },
});

export const getPostCount = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_channelId", (q) => q.eq("channelId", channelId))
      .collect();
    return posts.length;
  },
});

export const getAllPostCounts = query({
  args: {},
  handler: async (ctx) => {
    const channels = await ctx.db.query("channels").collect();
    const counts: Record<string, number> = {};
    for (const ch of channels) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_channelId", (q) => q.eq("channelId", ch._id))
        .collect();
      counts[ch._id] = posts.length;
    }
    return counts;
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("channels").first();
    if (existing) return "already seeded";

    const channelData = [
      { name: "Announcements", slug: "announcements", description: "Company news, rate changes, and new features from Charity Swipes", icon: "📢", isPublic: true, allowProspectView: true, sortOrder: 1, category: "public" as const },
      { name: "Charity Spotlight", slug: "charity-spotlight", description: "See which charities are being supported and their impact stories", icon: "💖", isPublic: true, allowProspectView: true, sortOrder: 2, category: "public" as const },
      { name: "Success Stories", slug: "success-stories", description: "Customer testimonials and case studies from Charity Swipes merchants", icon: "⭐", isPublic: true, allowProspectView: true, sortOrder: 3, category: "public" as const },
      { name: "Resources & Guides", slug: "resources-guides", description: "Guides on processing, POS systems, compliance, and more", icon: "📚", isPublic: true, allowProspectView: true, sortOrder: 4, category: "public" as const },
      { name: "General Discussion", slug: "general-discussion", description: "Open conversation between Charity Swipes merchants", icon: "💬", isPublic: false, allowProspectView: false, sortOrder: 5, category: "member" as const },
      { name: "POS Tips & Tricks", slug: "pos-tips", description: "Share and discover Clover POS tips, shortcuts, and workflows", icon: "🖥️", isPublic: false, allowProspectView: false, sortOrder: 6, category: "member" as const },
      { name: "Rate Talk", slug: "rate-talk", description: "Discuss processing rates, pricing updates, and industry trends", icon: "📊", isPublic: false, allowProspectView: false, sortOrder: 7, category: "member" as const },
      { name: "Charity Vote", slug: "charity-vote", description: "Vote on which charities to support next quarter", icon: "🗳️", isPublic: false, allowProspectView: false, sortOrder: 8, category: "member" as const },
      { name: "Referrals", slug: "referrals", description: "Refer other businesses and earn rewards for the community", icon: "🤝", isPublic: false, allowProspectView: false, sortOrder: 9, category: "member" as const },
    ];

    for (const ch of channelData) {
      await ctx.db.insert("channels", ch);
    }
    return "seeded";
  },
});
