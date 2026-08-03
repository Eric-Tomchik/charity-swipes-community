import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";

/**
 * CRM / merchant-portfolio backend.
 *
 * The legacy deployment's `crm.js` source was never recovered, only its data,
 * so these functions are a fresh implementation over the restored tables.
 *
 * PII fields (owner name, email, phone, address) were written by the old
 * backend as `enc:<base64>` and the encryption scheme is not recoverable from
 * the data alone. Rather than render ciphertext, `maskPii` replaces those
 * values with null and flags them, so the UI can say "encrypted" honestly.
 */

const ENCRYPTED_PREFIX = "enc:";

function isEncrypted(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith(ENCRYPTED_PREFIX);
}

function readable(value: string | undefined): string | null {
  if (value === undefined || value === "") return null;
  return isEncrypted(value) ? null : value;
}

async function requireCrmAccess(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .first();
  const role = profile?.role;
  if (role !== "admin" && role !== "sales_rep") {
    throw new Error("CRM access is limited to admins and sales reps");
  }
  return { userId, role, profile };
}

function maskMerchant(m: Doc<"crmMerchants">) {
  return {
    ...m,
    ownerName: readable(m.ownerName),
    email: readable(m.email),
    phone: readable(m.phone),
    address: readable(m.address),
    piiEncrypted:
      isEncrypted(m.ownerName) ||
      isEncrypted(m.email) ||
      isEncrypted(m.phone) ||
      isEncrypted(m.address),
  };
}

export const listMerchants = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    await requireCrmAccess(ctx);
    const merchants = status
      ? await ctx.db
          .query("crmMerchants")
          .withIndex("by_status", q => q.eq("status", status))
          .collect()
      : await ctx.db.query("crmMerchants").collect();
    return merchants
      .sort((a, b) => (b.monthlyVolume ?? 0) - (a.monthlyVolume ?? 0))
      .map(maskMerchant);
  },
});

export const getMerchant = query({
  args: { merchantId: v.id("crmMerchants") },
  handler: async (ctx, { merchantId }) => {
    await requireCrmAccess(ctx);
    const merchant = await ctx.db.get(merchantId);
    if (!merchant) return null;
    const transactions = await ctx.db
      .query("crmTransactions")
      .withIndex("by_merchantId", q => q.eq("merchantId", merchantId))
      .collect();
    const devices = await ctx.db
      .query("crmDevices")
      .withIndex("by_merchantId", q => q.eq("merchantId", merchantId))
      .collect();
    return {
      merchant: maskMerchant(merchant),
      transactions: transactions.sort(
        (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0),
      ),
      devices,
    };
  },
});

export const getPortfolioStats = query({
  args: {},
  handler: async ctx => {
    await requireCrmAccess(ctx);
    const merchants = await ctx.db.query("crmMerchants").collect();
    const transactions = await ctx.db.query("crmTransactions").collect();
    const active = merchants.filter(m => m.status === "active");

    const settled = transactions.filter(t => t.status === "settled");
    const volume = settled.reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const refunds = transactions.filter(t => t.type === "refund");

    const weightedRate =
      active.reduce(
        (sum, m) => sum + (m.effectiveRate ?? 0) * (m.monthlyVolume ?? 0),
        0,
      ) / (active.reduce((sum, m) => sum + (m.monthlyVolume ?? 0), 0) || 1);

    return {
      merchantCount: merchants.length,
      activeCount: active.length,
      monthlyVolume: active.reduce((sum, m) => sum + (m.monthlyVolume ?? 0), 0),
      monthlyTransactions: active.reduce(
        (sum, m) => sum + (m.monthlyTransactions ?? 0),
        0,
      ),
      charityDonated: merchants.reduce(
        (sum, m) => sum + (m.charityDonated ?? 0),
        0,
      ),
      avgEffectiveRate: Number(weightedRate.toFixed(2)),
      transactionCount: transactions.length,
      settledVolume: volume,
      refundCount: refunds.length,
      refundTotal: Math.abs(
        refunds.reduce((sum, t) => sum + (t.amount ?? 0), 0),
      ),
    };
  },
});

export const listTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requireCrmAccess(ctx);
    const merchants = await ctx.db.query("crmMerchants").collect();
    const names = new Map(
      merchants.map(m => [m._id as string, m.businessName]),
    );
    const transactions = await ctx.db.query("crmTransactions").collect();
    return transactions
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, limit ?? 100)
      .map(t => ({
        ...t,
        merchantName: names.get(t.merchantId) ?? "Unknown merchant",
      }));
  },
});

export const listResiduals = query({
  args: {},
  handler: async ctx => {
    await requireCrmAccess(ctx);
    const rows = await ctx.db.query("crmResiduals").collect();
    return rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const listCommissions = query({
  args: {},
  handler: async ctx => {
    await requireCrmAccess(ctx);
    const rows = await ctx.db.query("crmCommissions").collect();
    return rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const listDevices = query({
  args: {},
  handler: async ctx => {
    await requireCrmAccess(ctx);
    const devices = await ctx.db.query("crmDevices").collect();
    const merchants = await ctx.db.query("crmMerchants").collect();
    const names = new Map(
      merchants.map(m => [m._id as string, m.businessName]),
    );
    return devices.map(d => ({
      ...d,
      merchantName: d.merchantId ? (names.get(d.merchantId) ?? null) : null,
    }));
  },
});

export const listBoardingApplications = query({
  args: {},
  handler: async ctx => {
    await requireCrmAccess(ctx);
    const rows = await ctx.db.query("crmBoardingApplications").collect();
    return rows
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .map(r => ({
        ...r,
        ownerName: readable(r.ownerName),
        ownerEmail: readable(r.ownerEmail),
        ownerPhone: readable(r.ownerPhone),
        businessAddress: readable(r.businessAddress),
        // Never expose these, even if a decryption key turns up later.
        ownerSsn: undefined,
        bankAccountNumber: undefined,
        bankRoutingNumber: undefined,
        piiEncrypted: isEncrypted(r.ownerName) || isEncrypted(r.ownerEmail),
      }));
  },
});

export const updateMerchantStatus = mutation({
  args: {
    merchantId: v.id("crmMerchants"),
    status: v.string(),
  },
  handler: async (ctx, { merchantId, status }) => {
    await requireCrmAccess(ctx);
    await ctx.db.patch(merchantId, { status, updatedAt: Date.now() });
    return "ok";
  },
});

export const addMerchantNote = mutation({
  args: {
    merchantId: v.id("crmMerchants"),
    note: v.string(),
  },
  handler: async (ctx, { merchantId, note }) => {
    await requireCrmAccess(ctx);
    const merchant = await ctx.db.get(merchantId);
    if (!merchant) throw new Error("Merchant not found");
    const stamp = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const entry = `[${stamp}] ${note}`;
    await ctx.db.patch(merchantId, {
      notes: merchant.notes ? `${entry}\n${merchant.notes}` : entry,
      updatedAt: Date.now(),
    });
    return "ok";
  },
});
