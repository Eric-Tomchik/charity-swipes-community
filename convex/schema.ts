import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("customer"),
      v.literal("prospect"),
      v.literal("sales_rep"),
    ),
    accountStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("suspended"),
        v.literal("probation"),
        v.literal("removed"),
      ),
    ),
    suspendedReason: v.optional(v.string()),
    suspendedAt: v.optional(v.number()),
    probationUntil: v.optional(v.number()),
    tosAcceptedAt: v.optional(v.number()),
    businessName: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    referredByRepId: v.optional(v.string()),
    notifyEmail: v.optional(v.boolean()),
    notifyTickets: v.optional(v.boolean()),
    notifyAnnouncements: v.optional(v.boolean()),
    notifyMessages: v.optional(v.boolean()),
    profileImageUrl: v.optional(v.string()),
    joinedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_accountStatus", ["accountStatus"])
    .index("by_referredByRepId", ["referredByRepId"]),

  communitySettings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_key", ["key"]),

  channels: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    isPublic: v.boolean(),
    allowProspectView: v.boolean(),
    sortOrder: v.number(),
    category: v.union(v.literal("public"), v.literal("member")),
  }).index("by_slug", ["slug"]),

  posts: defineTable({
    channelId: v.id("channels"),
    authorId: v.string(),
    authorName: v.string(),
    authorRole: v.string(),
    content: v.string(),
    isPinned: v.boolean(),
    createdAt: v.number(),
  }).index("by_channelId", ["channelId"]),

  tickets: defineTable({
    userId: v.string(),
    userName: v.string(),
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
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  ticketMessages: defineTable({
    ticketId: v.id("tickets"),
    authorId: v.string(),
    authorName: v.string(),
    isStaff: v.boolean(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_ticketId", ["ticketId"]),

  charityStats: defineTable({
    totalDonated: v.number(),
    totalTransactions: v.number(),
    activeCharities: v.number(),
    lastUpdated: v.number(),
  }),

  charities: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    imageEmoji: v.string(),
    totalVotes: v.number(),
    totalDonated: v.number(),
    isActive: v.boolean(),
  }),

  charityVotes: defineTable({
    userId: v.string(),
    charityId: v.id("charities"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_charityId", ["charityId"])
    .index("by_userId_charityId", ["userId", "charityId"]),

  conversations: defineTable({
    participantIds: v.array(v.string()),
    lastMessageAt: v.number(),
    lastMessagePreview: v.string(),
  }).index("by_lastMessageAt", ["lastMessageAt"]),

  directMessages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    senderName: v.string(),
    senderRole: v.string(),
    content: v.string(),
    readBy: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_conversationId", ["conversationId"]),

  salesReps: defineTable({
    userId: v.string(),
    repUid: v.string(),
    name: v.string(),
    email: v.string(),
    totalReferrals: v.number(),
    totalSignups: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_repUid", ["repUid"]),

  referrals: defineTable({
    salesRepId: v.id("salesReps"),
    repUid: v.string(),
    prospectName: v.optional(v.string()),
    prospectEmail: v.optional(v.string()),
    prospectUserId: v.optional(v.string()),
    status: v.union(
      v.literal("clicked"),
      v.literal("signed_up"),
      v.literal("converted"),
    ),
    businessName: v.optional(v.string()),
    createdAt: v.number(),
    convertedAt: v.optional(v.number()),
  })
    .index("by_salesRepId", ["salesRepId"])
    .index("by_repUid", ["repUid"])
    .index("by_prospectUserId", ["prospectUserId"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    linkTo: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  applications: defineTable({
    userId: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    accountType: v.optional(v.string()),
    businessName: v.string(),
    businessType: v.optional(v.string()),
    businessAddress: v.optional(v.string()),
    currentProcessor: v.optional(v.string()),
    monthlyVolume: v.optional(v.string()),
    acceptsCards: v.optional(v.boolean()),
    merchantId: v.optional(v.string()),
    howHeard: v.optional(v.string()),
    charityInterest: v.optional(v.string()),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    reviewedBy: v.optional(v.string()),
    reviewNote: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  statements: defineTable({
    userId: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    businessName: v.optional(v.string()),
    fileStorageId: v.id("_storage"),
    fileUrl: v.optional(v.string()),
    fileName: v.string(),
    fileType: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewing"),
      v.literal("analyzed"),
      v.literal("rejected"),
    ),
    // Extracted data from statement
    currentProcessor: v.optional(v.string()),
    monthlyVolume: v.optional(v.number()),
    monthlyTransactions: v.optional(v.number()),
    effectiveRate: v.optional(v.number()),
    monthlyFees: v.optional(v.number()),
    // Itemized current fees
    interchangeFees: v.optional(v.number()),
    assessmentFees: v.optional(v.number()),
    processorMarkup: v.optional(v.number()),
    monthlyServiceFee: v.optional(v.number()),
    pciFee: v.optional(v.number()),
    statementFee: v.optional(v.number()),
    batchFee: v.optional(v.number()),
    otherFees: v.optional(v.number()),
    // Charity Swipes comparison
    csSavingsMonthly: v.optional(v.number()),
    csSavingsAnnual: v.optional(v.number()),
    csEffectiveRate: v.optional(v.number()),
    csMonthlyFees: v.optional(v.number()),
    csDonationMonthly: v.optional(v.number()),
    // Admin notes
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  channelReads: defineTable({
    userId: v.string(),
    channelSlug: v.string(),
    lastReadAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_channelSlug", ["userId", "channelSlug"]),

  merchantReferrals: defineTable({
    userId: v.string(),
    referralUid: v.string(),
    name: v.string(),
    email: v.string(),
    businessName: v.optional(v.string()),
    totalReferrals: v.number(),
    totalSignups: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_referralUid", ["referralUid"]),

  merchantReferralClicks: defineTable({
    merchantReferralId: v.id("merchantReferrals"),
    referralUid: v.string(),
    prospectName: v.optional(v.string()),
    prospectEmail: v.optional(v.string()),
    prospectUserId: v.optional(v.string()),
    status: v.union(
      v.literal("clicked"),
      v.literal("signed_up"),
      v.literal("converted"),
    ),
    businessName: v.optional(v.string()),
    createdAt: v.number(),
    convertedAt: v.optional(v.number()),
  })
    .index("by_merchantReferralId", ["merchantReferralId"])
    .index("by_referralUid", ["referralUid"])
    .index("by_prospectUserId", ["prospectUserId"])
    .index("by_status", ["status"]),

  resources: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("clover_guides"),
      v.literal("cash_discount"),
      v.literal("compliance_legal"),
      v.literal("industry_news"),
      v.literal("technical"),
      v.literal("general"),
    ),
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    downloadCount: v.number(),
    isPinned: v.boolean(),
    uploadedBy: v.string(),
    uploadedByName: v.string(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_createdAt", ["createdAt"])
    .index("by_isPinned", ["isPinned"]),

  leads: defineTable({
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
    claimedByRepId: v.optional(v.id("salesReps")),
    claimedByRepName: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    contactStatus: v.union(
      v.literal("unclaimed"),
      v.literal("claimed"),
      v.literal("attempted"),
      v.literal("contacted"),
      v.literal("converted"),
      v.literal("not_interested"),
    ),
    lastContactedAt: v.optional(v.number()),
    contactNotes: v.optional(v.string()),
    createdAt: v.number(),
    // Apollo enrichment data
    apolloEnriched: v.optional(v.boolean()),
    apolloEnrichedAt: v.optional(v.number()),
    ownerTitle: v.optional(v.string()),
    ownerLinkedin: v.optional(v.string()),
    companySize: v.optional(v.string()),
    annualRevenue: v.optional(v.string()),
    technologies: v.optional(v.string()),
    ownerEmail: v.optional(v.string()),
    ownerPhone: v.optional(v.string()),
  })
    .index("by_contactStatus", ["contactStatus"])
    .index("by_claimedByRepId", ["claimedByRepId"])
    .index("by_businessName", ["businessName"])
    .index("by_state", ["state"])
    .index("by_industry", ["industry"]),
});

export default schema;
