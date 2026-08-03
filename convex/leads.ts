import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List leads visible to the current user (reps only see unclaimed + their own)
export const list = query({
  args: {
    statusFilter: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
    industryFilter: v.optional(v.string()),
    myClaimsOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let leads = await ctx.db.query("leads").collect();

    const userId = await getAuthUserId(ctx);
    let currentRepId: string | null = null;
    let isAdmin = false;

    if (userId) {
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      isAdmin = profile?.role === "admin";

      if (!isAdmin) {
        const rep = await ctx.db
          .query("salesReps")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();
        if (rep) currentRepId = rep._id;
      }
    }

    // Reps: only see unclaimed leads + their own claimed leads (other reps' leads are locked/hidden)
    if (!isAdmin && currentRepId) {
      leads = leads.filter(
        (l) => !l.claimedByRepId || l.claimedByRepId === currentRepId,
      );
    }

    // If myClaimsOnly, filter to only the current rep's leads
    if (args.myClaimsOnly) {
      if (currentRepId) {
        leads = leads.filter((l) => l.claimedByRepId === currentRepId);
      } else if (isAdmin) {
        // Admin with myClaimsOnly doesn't really apply, return all
      } else {
        return [];
      }
    }

    if (args.statusFilter && args.statusFilter !== "all") {
      leads = leads.filter((l) => l.contactStatus === args.statusFilter);
    }
    if (args.stateFilter && args.stateFilter !== "all") {
      // State code → full name lookup for flexible matching
      const STATE_NAMES: Record<string, string> = {
        AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
        CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
        HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
        KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
        MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
        MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
        NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
        OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
        SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
        VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
        DC:"District of Columbia",
      };
      const filterCode = args.stateFilter.toUpperCase();
      const filterName = STATE_NAMES[filterCode] || args.stateFilter;
      leads = leads.filter((l) => {
        if (!l.state) return false;
        const s = l.state.trim();
        return s.toUpperCase() === filterCode || s.toLowerCase() === filterName.toLowerCase();
      });
    }
    if (args.industryFilter && args.industryFilter !== "all") {
      leads = leads.filter((l) => l.industry === args.industryFilter);
    }

    return leads.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get rep's personal lead database — all leads claimed by the current rep
export const getRepLeads = query({
  args: {
    statusFilter: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
    industryFilter: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { leads: [], stats: { total: 0, claimed: 0, attempted: 0, contacted: 0, converted: 0, notInterested: 0 } };

    const rep = await ctx.db
      .query("salesReps")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Admin can also view — in that case return all claimed leads
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const isAdmin = profile?.role === "admin";

    let leads;
    if (rep) {
      leads = (await ctx.db.query("leads").collect()).filter(
        (l) => l.claimedByRepId === rep._id,
      );
    } else if (isAdmin) {
      // Admin sees nothing in "my leads" since they're not a rep
      return { leads: [], stats: { total: 0, claimed: 0, attempted: 0, contacted: 0, converted: 0, notInterested: 0 } };
    } else {
      return { leads: [], stats: { total: 0, claimed: 0, attempted: 0, contacted: 0, converted: 0, notInterested: 0 } };
    }

    // Stats before filtering
    const stats = {
      total: leads.length,
      claimed: leads.filter((l) => l.contactStatus === "claimed").length,
      attempted: leads.filter((l) => l.contactStatus === "attempted").length,
      contacted: leads.filter((l) => l.contactStatus === "contacted").length,
      converted: leads.filter((l) => l.contactStatus === "converted").length,
      notInterested: leads.filter((l) => l.contactStatus === "not_interested").length,
    };

    // Apply filters
    if (args.statusFilter && args.statusFilter !== "all") {
      leads = leads.filter((l) => l.contactStatus === args.statusFilter);
    }
    if (args.stateFilter && args.stateFilter !== "all") {
      const filterCode = args.stateFilter.toUpperCase();
      leads = leads.filter((l) => l.state?.toUpperCase() === filterCode);
    }
    if (args.industryFilter && args.industryFilter !== "all") {
      leads = leads.filter((l) => l.industry === args.industryFilter);
    }
    if (args.searchQuery) {
      const q = args.searchQuery.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.businessName.toLowerCase().includes(q) ||
          l.ownerName?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.city?.toLowerCase().includes(q),
      );
    }

    return { leads: leads.sort((a, b) => (b.claimedAt ?? b.createdAt) - (a.claimedAt ?? a.createdAt)), stats };
  },
});

// Get lead stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("leads").collect();
    const userId = await getAuthUserId(ctx);
    let myLeads = 0;
    let myConverted = 0;
    if (userId) {
      const rep = await ctx.db
        .query("salesReps")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (rep) {
        const mine = all.filter((l) => l.claimedByRepId === rep._id);
        myLeads = mine.length;
        myConverted = mine.filter((l) => l.contactStatus === "converted").length;
      }
    }
    return {
      total: all.length,
      unclaimed: all.filter((l) => l.contactStatus === "unclaimed").length,
      claimed: all.filter((l) => l.contactStatus === "claimed").length,
      attempted: all.filter((l) => l.contactStatus === "attempted").length,
      contacted: all.filter((l) => l.contactStatus === "contacted").length,
      converted: all.filter((l) => l.contactStatus === "converted").length,
      notInterested: all.filter((l) => l.contactStatus === "not_interested").length,
      myLeads,
      myConverted,
    };
  },
});

// Get unique states and industries for filter dropdowns
export const getFilterOptions = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("leads").collect();
    const states = [...new Set(all.map((l) => l.state).filter(Boolean))].sort();
    const industries = [...new Set(all.map((l) => l.industry).filter(Boolean))].sort();
    return { states, industries };
  },
});

// Create a single lead
export const create = mutation({
  args: {
    businessName: v.string(),
    entityType: v.optional(v.string()),
    ownerName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    posSystem: v.optional(v.string()),
    currentProcessor: v.optional(v.string()),
    cashDiscountProgram: v.optional(
      v.union(v.literal("yes"), v.literal("no"), v.literal("unknown")),
    ),
    lookingForNewPOS: v.optional(
      v.union(v.literal("yes"), v.literal("no"), v.literal("unknown")),
    ),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Duplicate check: same business name + (phone or email)
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_businessName", (q) => q.eq("businessName", args.businessName))
      .collect();
    const isDupe = existing.some(
      (e) =>
        (args.phone && e.phone && e.phone === args.phone) ||
        (args.email && e.email && e.email.toLowerCase() === args.email.toLowerCase()),
    );
    if (isDupe) throw new Error("Duplicate lead: matching business name + phone or email");

    return await ctx.db.insert("leads", {
      ...args,
      contactStatus: "unclaimed",
      createdAt: Date.now(),
    });
  },
});

// Bulk import leads (up to 50 at a time for Convex limits)
export const bulkImport = mutation({
  args: {
    leads: v.array(
      v.object({
        businessName: v.string(),
        entityType: v.optional(v.string()),
        ownerName: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        website: v.optional(v.string()),
        industry: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        posSystem: v.optional(v.string()),
        currentProcessor: v.optional(v.string()),
        cashDiscountProgram: v.optional(
          v.union(v.literal("yes"), v.literal("no"), v.literal("unknown")),
        ),
        lookingForNewPOS: v.optional(
          v.union(v.literal("yes"), v.literal("no"), v.literal("unknown")),
        ),
        source: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { leads }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin or rep
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || (profile.role !== "admin" && profile.role !== "sales_rep"))
      throw new Error("Admin or Sales Rep only");

    // Get all existing for dedup
    const allExisting = await ctx.db.query("leads").collect();
    const existingSet = new Set(
      allExisting.map(
        (e) =>
          `${e.businessName.toLowerCase()}|${(e.phone || "").toLowerCase()}|${(e.email || "").toLowerCase()}`,
      ),
    );

    let imported = 0;
    let skipped = 0;
    for (const lead of leads) {
      const key = `${lead.businessName.toLowerCase()}|${(lead.phone || "").toLowerCase()}|${(lead.email || "").toLowerCase()}`;
      if (existingSet.has(key)) {
        skipped++;
        continue;
      }
      existingSet.add(key);
      await ctx.db.insert("leads", {
        ...lead,
        contactStatus: "unclaimed",
        createdAt: Date.now(),
      });
      imported++;
    }
    return { imported, skipped };
  },
});

// Rep claims a lead
export const claim = mutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const rep = await ctx.db
      .query("salesReps")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!rep) throw new Error("Must be a sales rep");

    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.claimedByRepId && lead.claimedByRepId !== rep._id)
      throw new Error("Already claimed by another rep");

    await ctx.db.patch(leadId, {
      claimedByRepId: rep._id,
      claimedByRepName: rep.name,
      claimedAt: Date.now(),
      contactStatus: lead.contactStatus === "unclaimed" ? "claimed" : lead.contactStatus,
    });
  },
});

// Rep updates contact status
export const updateContactStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.union(
      v.literal("claimed"),
      v.literal("attempted"),
      v.literal("contacted"),
      v.literal("converted"),
      v.literal("not_interested"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { leadId, status, notes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");

    // Only the claiming rep or admin can update
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (profile?.role !== "admin") {
      const rep = await ctx.db
        .query("salesReps")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (!rep || lead.claimedByRepId !== rep._id)
        throw new Error("Only the claiming rep or admin can update");
    }

    const updates: Record<string, any> = { contactStatus: status };
    if (status === "attempted" || status === "contacted") {
      updates.lastContactedAt = Date.now();
    }
    if (notes !== undefined) {
      updates.contactNotes = notes;
    }

    await ctx.db.patch(leadId, updates);
  },
});

// Admin: unclaim a lead (release it back)
export const unclaim = mutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admin only");

    await ctx.db.patch(leadId, {
      claimedByRepId: undefined,
      claimedByRepName: undefined,
      claimedAt: undefined,
      contactStatus: "unclaimed",
      lastContactedAt: undefined,
      contactNotes: undefined,
    });
  },
});

// Delete a lead
export const remove = mutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile || profile.role !== "admin") throw new Error("Admin only");
    await ctx.db.delete(leadId);
  },
});
