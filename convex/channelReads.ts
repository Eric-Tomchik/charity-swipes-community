import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mark a channel as read (called when user opens a channel)
export const markRead = mutation({
  args: { channelSlug: v.string() },
  handler: async (ctx, { channelSlug }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("channelReads")
      .withIndex("by_userId_channelSlug", (q) =>
        q.eq("userId", userId).eq("channelSlug", channelSlug),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadAt: Date.now() });
    } else {
      await ctx.db.insert("channelReads", {
        userId,
        channelSlug,
        lastReadAt: Date.now(),
      });
    }
  },
});

// Get unread counts for all channels (number of posts since last read)
export const getUnreadCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return {};

    const channels = await ctx.db.query("channels").collect();
    const reads = await ctx.db
      .query("channelReads")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const readMap = new Map(reads.map((r) => [r.channelSlug, r.lastReadAt]));
    const counts: Record<string, number> = {};

    for (const ch of channels) {
      const lastRead = readMap.get(ch.slug) ?? 0;
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_channelId", (q) => q.eq("channelId", ch._id))
        .collect();
      const unread = posts.filter((p) => p.createdAt > lastRead && p.authorId !== userId).length;
      if (unread > 0) {
        counts[ch.slug] = unread;
      }
    }

    return counts;
  },
});
