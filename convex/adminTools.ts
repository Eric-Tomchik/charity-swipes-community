import { modifyAccountCredentials } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * One-off maintenance helper: set a new password for an existing
 * email/password account. Run from the CLI with `convex run`, never exposed
 * to the client (internalAction).
 */
export const setPassword = internalAction({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: args.email, secret: args.password },
    });
    return `password updated for ${args.email}`;
  },
});
