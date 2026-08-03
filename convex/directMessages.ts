import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allConversations = await ctx.db
      .query("conversations")
      .collect();

    const myConversations = allConversations.filter((c) =>
      c.participantIds.includes(userId),
    );

    // Get participant profiles
    const enriched = await Promise.all(
      myConversations.map(async (conv) => {
        const otherIds = conv.participantIds.filter((id) => id !== userId);
        const others = await Promise.all(
          otherIds.map((id) =>
            ctx.db
              .query("userProfiles")
              .withIndex("by_userId", (q) => q.eq("userId", id))
              .first(),
          ),
        );
        // Count unread messages
        const messages = await ctx.db
          .query("directMessages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conv._id),
          )
          .collect();
        const unreadCount = messages.filter(
          (m) => !m.readBy.includes(userId) && m.senderId !== userId,
        ).length;

        return {
          ...conv,
          otherParticipants: others.filter(Boolean),
          unreadCount,
        };
      }),
    );

    return enriched.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const messages = await ctx.db
      .query("directMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const startConversation = mutation({
  args: { recipientId: v.string(), message: v.string() },
  handler: async (ctx, { recipientId, message }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("No profile");

    // Check for existing conversation
    const allConversations = await ctx.db.query("conversations").collect();
    const existing = allConversations.find(
      (c) =>
        c.participantIds.includes(userId) &&
        c.participantIds.includes(recipientId) &&
        c.participantIds.length === 2,
    );

    let conversationId;
    if (existing) {
      conversationId = existing._id;
      await ctx.db.patch(existing._id, {
        lastMessageAt: Date.now(),
        lastMessagePreview: message.slice(0, 100),
      });
    } else {
      conversationId = await ctx.db.insert("conversations", {
        participantIds: [userId, recipientId],
        lastMessageAt: Date.now(),
        lastMessagePreview: message.slice(0, 100),
      });
    }

    await ctx.db.insert("directMessages", {
      conversationId,
      senderId: userId,
      senderName: profile.name,
      senderRole: profile.role,
      content: message,
      readBy: [userId],
      createdAt: Date.now(),
    });

    // Create notification for recipient
    await ctx.db.insert("notifications", {
      userId: recipientId,
      type: "dm",
      title: "New Message",
      message: `${profile.name} sent you a message: "${message.slice(0, 80)}${message.length > 80 ? "..." : ""}"`,
      linkTo: "/messages",
      isRead: false,
      createdAt: Date.now(),
    });

    return conversationId;
  },
});

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), content: v.string() },
  handler: async (ctx, { conversationId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("No profile");

    await ctx.db.insert("directMessages", {
      conversationId,
      senderId: userId,
      senderName: profile.name,
      senderRole: profile.role,
      content,
      readBy: [userId],
      createdAt: Date.now(),
    });

    await ctx.db.patch(conversationId, {
      lastMessageAt: Date.now(),
      lastMessagePreview: content.slice(0, 100),
    });

    // Create notification for all other participants
    const conversation = await ctx.db.get(conversationId);
    if (conversation) {
      const otherIds = conversation.participantIds.filter((id) => id !== userId);
      for (const otherId of otherIds) {
        await ctx.db.insert("notifications", {
          userId: otherId,
          type: "dm",
          title: "New Message",
          message: `${profile.name}: "${content.slice(0, 80)}${content.length > 80 ? "..." : ""}"`,
          linkTo: "/messages",
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const markAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messages = await ctx.db
      .query("directMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversationId),
      )
      .collect();

    for (const msg of messages) {
      if (!msg.readBy.includes(userId)) {
        await ctx.db.patch(msg._id, {
          readBy: [...msg.readBy, userId],
        });
      }
    }
  },
});

export const getAdminsAndReps = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Check if current user is an admin
    const myProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (myProfile?.role === "admin") {
      // Admins can message ALL members
      const allProfiles = await ctx.db.query("userProfiles").collect();
      return allProfiles.filter((p) => p.userId !== userId);
    }

    // Non-admins can only message admins and sales reps
    const admins = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    const reps = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "sales_rep"))
      .collect();
    return [...admins, ...reps].filter((p) => p.userId !== userId);
  },
});

export const totalUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const allConversations = await ctx.db.query("conversations").collect();
    const myConversations = allConversations.filter((c) =>
      c.participantIds.includes(userId),
    );

    let total = 0;
    for (const conv of myConversations) {
      const messages = await ctx.db
        .query("directMessages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", conv._id),
        )
        .collect();
      total += messages.filter(
        (m) => !m.readBy.includes(userId) && m.senderId !== userId,
      ).length;
    }
    return total;
  },
});
