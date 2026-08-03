import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByChannel = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_channelId", (q) => q.eq("channelId", channelId))
      .collect();
    return posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

export const create = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  handler: async (ctx, { channelId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("No profile");
    if (profile.role === "prospect") throw new Error("Prospects cannot post");

    return await ctx.db.insert("posts", {
      channelId,
      authorId: userId,
      authorName: profile.name,
      authorRole: profile.role,
      content,
      isPinned: false,
      createdAt: Date.now(),
    });
  },
});

export const togglePin = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admin only");

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");
    await ctx.db.patch(postId, { isPinned: !post.isPinned });
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("posts").first();
    if (existing) return "already seeded";

    const channels = await ctx.db.query("channels").collect();
    const channelMap = new Map(channels.map((c) => [c.slug, c._id]));

    const now = Date.now();
    const seedPosts = [
      { slug: "announcements", authorName: "Charity Swipes Team", authorRole: "admin", content: "🎉 Welcome to the Charity Swipes Community! We're thrilled to launch this space for our merchants to connect, share insights, and make an even bigger impact together. Explore the channels, ask questions, and help us shape the future of processing that gives back!", isPinned: true, offset: -86400000 },
      { slug: "announcements", authorName: "Charity Swipes Team", authorRole: "admin", content: "📢 New Feature Alert: We've just rolled out our updated POS dashboard with real-time charity contribution tracking. Every swipe now shows exactly how much went to your chosen charity. Update your terminal software to v4.2 to see it in action!", isPinned: false, offset: -86400000 },
      { slug: "charity-spotlight", authorName: "Charity Swipes Team", authorRole: "admin", content: "💖 This month's Charity Spotlight: St. Jude Children's Research Hospital! Thanks to our merchant community, we've collectively donated $12,400 to support families of children battling cancer. Every card swipe at your store helps fund life-saving research.", isPinned: false, offset: -172800000 },
      { slug: "charity-spotlight", authorName: "Demo Merchant", authorRole: "customer", content: "So proud to be part of this. My customers love knowing their purchases help fund children's cancer research. It's become a real talking point at the register! 💪", isPinned: false, offset: -86400000 },
      { slug: "success-stories", authorName: "Demo Merchant", authorRole: "customer", content: "⭐ Just hit our 6-month anniversary with Charity Swipes! Since switching, our processing fees dropped 15% AND we've contributed over $2,000 to Feeding America. My customers appreciate the give-back model — it's been great for business and community!", isPinned: false, offset: -172800000 },
      { slug: "success-stories", authorName: "Charity Swipes Team", authorRole: "admin", content: "🏆 Congrats to Main Street Bakery for being our Top Contributor this quarter! Their consistent volume helped generate $4,500 in charity donations. Thank you for making every transaction count!", isPinned: false, offset: -86400000 },
      { slug: "resources-guides", authorName: "Charity Swipes Team", authorRole: "admin", content: "📚 New Guide: 'Getting the Most Out of Your Clover POS'\n\nWe've put together a comprehensive guide covering:\n• Setting up contactless payments\n• Customizing your receipt with charity info\n• Running end-of-day reports\n• Troubleshooting common connectivity issues\n\nCheck the Resources section for the full PDF!", isPinned: true, offset: -259200000 },
      { slug: "resources-guides", authorName: "Charity Swipes Team", authorRole: "admin", content: "📋 PCI Compliance Reminder: Your annual PCI DSS self-assessment questionnaire is due by end of Q2. Need help? Open a support ticket and our compliance team will walk you through it step by step.", isPinned: false, offset: -172800000 },
      { slug: "general-discussion", authorName: "Demo Merchant", authorRole: "customer", content: "Hey everyone! New here — just switched from Square to Charity Swipes last week. Loving the lower rates and the charity component. Any tips for a smooth transition?", isPinned: false, offset: -172800000 },
      { slug: "general-discussion", authorName: "Charity Swipes Team", authorRole: "admin", content: "Welcome aboard! 🎉 Here are a few tips:\n1. Make sure to update your POS software to the latest version\n2. Set up your charity preference in your merchant dashboard\n3. Let your customers know about the give-back — it's a great conversation starter!\n\nFeel free to ask anything in the channels!", isPinned: false, offset: -86400000 },
      { slug: "pos-tips", authorName: "Demo Merchant", authorRole: "customer", content: "🖥️ Pro tip: You can set up a custom home screen on your Clover with quick-access buttons for your most common transactions. Go to Setup > Home Screen > Customize. Saves me about 30 seconds per transaction!", isPinned: false, offset: -86400000 },
    ];

    for (const post of seedPosts) {
      const channelId = channelMap.get(post.slug);
      if (channelId) {
        await ctx.db.insert("posts", {
          channelId,
          authorId: "seed",
          authorName: post.authorName,
          authorRole: post.authorRole,
          content: post.content,
          isPinned: post.isPinned,
          createdAt: now + post.offset,
        });
      }
    }
    return "seeded";
  },
});
