/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as callAnalysis from "../callAnalysis.js";
import type * as calls from "../calls.js";
import type * as dashboard from "../dashboard.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as lib_performance from "../lib/performance.js";
import type * as lib_teamAccess from "../lib/teamAccess.js";
import type * as notifications from "../notifications.js";
import type * as teams from "../teams.js";
import type * as telephony from "../telephony.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  callAnalysis: typeof callAnalysis;
  calls: typeof calls;
  dashboard: typeof dashboard;
  feedback: typeof feedback;
  http: typeof http;
  "lib/performance": typeof lib_performance;
  "lib/teamAccess": typeof lib_teamAccess;
  notifications: typeof notifications;
  teams: typeof teams;
  telephony: typeof telephony;
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
