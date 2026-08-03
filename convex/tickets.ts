import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").collect();
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getWithMessages = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) return null;
    const messages = await ctx.db
      .query("ticketMessages")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", ticketId))
      .collect();
    return { ticket, messages: messages.sort((a, b) => a.createdAt - b.createdAt) };
  },
});

export const create = mutation({
  args: {
    subject: v.string(),
    category: v.union(
      v.literal("billing"),
      v.literal("technical"),
      v.literal("compliance"),
      v.literal("general"),
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("urgent"),
    ),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("No profile");

    const ticketId = await ctx.db.insert("tickets", {
      userId,
      userName: profile.name,
      subject: args.subject,
      category: args.category,
      priority: args.priority,
      status: "open",
      createdAt: Date.now(),
    });

    await ctx.db.insert("ticketMessages", {
      ticketId,
      authorId: userId,
      authorName: profile.name,
      isStaff: profile.role === "admin",
      content: args.message,
      createdAt: Date.now(),
    });

    return ticketId;
  },
});

export const addMessage = mutation({
  args: {
    ticketId: v.id("tickets"),
    content: v.string(),
  },
  handler: async (ctx, { ticketId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("No profile");

    return await ctx.db.insert("ticketMessages", {
      ticketId,
      authorId: userId,
      authorName: profile.name,
      isStaff: profile.role === "admin",
      content,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
  },
  handler: async (ctx, { ticketId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(ticketId, { status });
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("tickets").first();
    if (existing) return "already seeded";

    const now = Date.now();
    const tickets = [
      { userName: "Demo Merchant", subject: "POS terminal not connecting to WiFi", category: "technical" as const, priority: "urgent" as const, status: "in_progress" as const, offset: -86400000, messages: [
        { authorName: "Demo Merchant", isStaff: false, content: "My Clover Flex suddenly can't connect to our WiFi network. I've tried restarting both the terminal and the router. Other devices connect fine. Need help ASAP — we're losing sales!", offset: -86400000 },
        { authorName: "Charity Swipes Team", isStaff: true, content: "Sorry to hear that! Let's troubleshoot:\n1. Go to Settings > Network on your Flex\n2. Forget the current network and re-add it\n3. Make sure you're on 2.4GHz, not 5GHz\n\nIf that doesn't work, we may need to check your Clover firmware version.", offset: -43200000 },
      ]},
      { userName: "Demo Merchant", subject: "How to set up contactless payments?", category: "general" as const, priority: "low" as const, status: "open" as const, offset: -86400000, messages: [
        { authorName: "Demo Merchant", isStaff: false, content: "I'd like to start accepting Apple Pay and Google Pay. What do I need to do on my end to enable contactless/NFC payments on my terminal?", offset: -86400000 },
      ]},
      { userName: "Demo Merchant", subject: "Question about monthly statement", category: "billing" as const, priority: "normal" as const, status: "resolved" as const, offset: -259200000, messages: [
        { authorName: "Demo Merchant", isStaff: false, content: "I noticed a charge on my March statement labeled 'PCI Non-Compliance Fee.' I thought I completed my PCI questionnaire. Can you clarify?", offset: -259200000 },
        { authorName: "Charity Swipes Team", isStaff: true, content: "Great question! It looks like your annual SAQ was due in February. The fee is automatically applied when the questionnaire isn't submitted on time. I've waived the fee for this month — please complete your SAQ at your earliest convenience.", offset: -172800000 },
        { authorName: "Demo Merchant", isStaff: false, content: "Thank you so much! I'll get it done this week.", offset: -86400000 },
      ]},
    ];

    for (const t of tickets) {
      const ticketId = await ctx.db.insert("tickets", {
        userId: "seed-merchant",
        userName: t.userName,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdAt: now + t.offset,
      });
      for (const m of t.messages) {
        await ctx.db.insert("ticketMessages", {
          ticketId,
          authorId: m.isStaff ? "seed-admin" : "seed-merchant",
          authorName: m.authorName,
          isStaff: m.isStaff,
          content: m.content,
          createdAt: now + m.offset,
        });
      }
    }
    return "seeded";
  },
});
