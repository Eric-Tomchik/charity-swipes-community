/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ViktorSpacesEmail from "../ViktorSpacesEmail.js";
import type * as adminTools from "../adminTools.js";
import type * as applications from "../applications.js";
import type * as auth from "../auth.js";
import type * as channelReads from "../channelReads.js";
import type * as channels from "../channels.js";
import type * as charity from "../charity.js";
import type * as communitySettings from "../communitySettings.js";
import type * as constants from "../constants.js";
import type * as contactForm from "../contactForm.js";
import type * as crm from "../crm.js";
import type * as directMessages from "../directMessages.js";
import type * as http from "../http.js";
import type * as leadScraper from "../leadScraper.js";
import type * as leads from "../leads.js";
import type * as merchantReferrals from "../merchantReferrals.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as resources from "../resources.js";
import type * as salesReps from "../salesReps.js";
import type * as seedTestUser from "../seedTestUser.js";
import type * as statements from "../statements.js";
import type * as storage from "../storage.js";
import type * as testAuth from "../testAuth.js";
import type * as tickets from "../tickets.js";
import type * as userProfiles from "../userProfiles.js";
import type * as users from "../users.js";
import type * as viktorSpaceAuthConfig from "../viktorSpaceAuthConfig.js";
import type * as viktorSpaceAuthEnv from "../viktorSpaceAuthEnv.js";
import type * as viktorTools from "../viktorTools.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ViktorSpacesEmail: typeof ViktorSpacesEmail;
  adminTools: typeof adminTools;
  applications: typeof applications;
  auth: typeof auth;
  channelReads: typeof channelReads;
  channels: typeof channels;
  charity: typeof charity;
  communitySettings: typeof communitySettings;
  constants: typeof constants;
  contactForm: typeof contactForm;
  crm: typeof crm;
  directMessages: typeof directMessages;
  http: typeof http;
  leadScraper: typeof leadScraper;
  leads: typeof leads;
  merchantReferrals: typeof merchantReferrals;
  notifications: typeof notifications;
  posts: typeof posts;
  resources: typeof resources;
  salesReps: typeof salesReps;
  seedTestUser: typeof seedTestUser;
  statements: typeof statements;
  storage: typeof storage;
  testAuth: typeof testAuth;
  tickets: typeof tickets;
  userProfiles: typeof userProfiles;
  users: typeof users;
  viktorSpaceAuthConfig: typeof viktorSpaceAuthConfig;
  viktorSpaceAuthEnv: typeof viktorSpaceAuthEnv;
  viktorTools: typeof viktorTools;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
