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
      v.literal("archived"),
    ),
    reviewedBy: v.optional(v.string()),
    reviewNote: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
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
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
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

  // ---------------------------------------------------------------------------
  // CRM / merchant portfolio (restored from the legacy deployment).
  // Every field beyond the identifying ones is optional: these documents were
  // written by an older codebase and existing rows must keep validating.
  // ---------------------------------------------------------------------------
  crmMerchants: defineTable({
    businessName: v.string(),
    dba: v.optional(v.string()),
    mid: v.optional(v.string()),
    cloverMerchantId: v.optional(v.string()),
    status: v.optional(v.string()),
    industry: v.optional(v.string()),
    equipmentType: v.optional(v.string()),
    // PII, stored encrypted as "enc:<base64>" by the legacy backend.
    ownerName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    monthlyVolume: v.optional(v.number()),
    monthlyTransactions: v.optional(v.number()),
    avgTicket: v.optional(v.number()),
    effectiveRate: v.optional(v.number()),
    charityDonated: v.optional(v.number()),
    charityId: v.optional(v.string()),
    cardMix: v.optional(v.string()),
    contractEnd: v.optional(v.string()),
    assignedRepId: v.optional(v.string()),
    assignedRepName: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastTransactionAt: v.optional(v.number()),
    onboardedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_assignedRepId", ["assignedRepId"])
    .index("by_businessName", ["businessName"]),

  crmTransactions: defineTable({
    merchantId: v.string(),
    amount: v.optional(v.number()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
    customerName: v.optional(v.string()),
    cloverPaymentId: v.optional(v.string()),
    timestamp: v.optional(v.number()),
    settledAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_merchantId", ["merchantId"])
    .index("by_status", ["status"]),

  crmResiduals: defineTable({
    month: v.string(),
    grossRevenue: v.optional(v.number()),
    processorCost: v.optional(v.number()),
    netRevenue: v.optional(v.number()),
    charityDonation: v.optional(v.number()),
    merchantCount: v.optional(v.number()),
    totalTransactions: v.optional(v.number()),
    totalVolume: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  }).index("by_month", ["month"]),

  crmCommissions: defineTable({
    month: v.string(),
    repId: v.optional(v.string()),
    repName: v.optional(v.string()),
    grossResidual: v.optional(v.number()),
    splitPercentage: v.optional(v.number()),
    bonuses: v.optional(v.number()),
    totalEarnings: v.optional(v.number()),
    netPayout: v.optional(v.number()),
    merchantsManaged: v.optional(v.number()),
    totalVolume: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_month", ["month"])
    .index("by_repId", ["repId"]),

  crmDevices: defineTable({
    deviceType: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    terminalId: v.optional(v.string()),
    deploymentStatus: v.optional(v.string()),
    merchantId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_deploymentStatus", ["deploymentStatus"])
    .index("by_merchantId", ["merchantId"]),

  crmChargebacks: defineTable({
    merchantId: v.optional(v.string()),
    amount: v.optional(v.number()),
    reason: v.optional(v.string()),
    status: v.optional(v.string()),
    caseNumber: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    receivedAt: v.optional(v.number()),
    dueAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_merchantId", ["merchantId"]),

  crmBoardingApplications: defineTable({
    legalBusinessName: v.optional(v.string()),
    dba: v.optional(v.string()),
    businessType: v.optional(v.string()),
    industry: v.optional(v.string()),
    status: v.optional(v.string()),
    statusHistory: v.optional(v.string()),
    pricingModel: v.optional(v.string()),
    adjustmentRate: v.optional(v.number()),
    estimatedMonthlyVolume: v.optional(v.number()),
    estimatedAvgTicket: v.optional(v.number()),
    // PII / bank details, encrypted as "enc:<base64>" by the legacy backend.
    ownerName: v.optional(v.string()),
    ownerEmail: v.optional(v.string()),
    ownerPhone: v.optional(v.string()),
    ownerDob: v.optional(v.string()),
    ownerSsn: v.optional(v.string()),
    businessAddress: v.optional(v.string()),
    ein: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    bankRoutingNumber: v.optional(v.string()),
    assignedRepId: v.optional(v.string()),
    assignedRepName: v.optional(v.string()),
    requestedDeviceType: v.optional(v.string()),
    requestedDeviceCount: v.optional(v.number()),
    fiservApplicationId: v.optional(v.string()),
    mpaGenerated: v.optional(v.boolean()),
    mpaSignedAt: v.optional(v.number()),
    attestationSigned: v.optional(v.boolean()),
    attestationSignedAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),
});

export default schema;
