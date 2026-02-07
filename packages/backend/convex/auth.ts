import { expo } from "@better-auth/expo";
import {
  createClient,
  type GenericCtx,
  type AuthFunctions,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  defaultRoles,
} from "better-auth/plugins/admin/access";
import { admin as adminPlugin } from "better-auth/plugins";

import authSchema from "./betterAuth/schema";

import type { DataModel } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;
const nativeAppUrl = process.env.NATIVE_APP_URL || "microhack://";

// Parse additional origins from comma-separated env variable
const additionalOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
  : [];

// Required for triggers to work
const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
    authFunctions,
    verbose: false,
    triggers: {
      user: {
        async onCreate(ctx, doc) {
          // Auto-create userProfiles record for new users
          const now = Date.now();
          await ctx.db.insert("userProfiles", {
            userId: doc._id,
            preferredLanguage: "fr",
            notificationChannel: "in_app",
            createdAt: now,
            updatedAt: now,
          });
        },
      },
    },
  },
);

// Export trigger handlers for the component to use
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const port_admin = ac.newRole({
  ...adminAc.statements,
});

export const terminal_operator = defaultRoles.user;

export const carrier = defaultRoles.user;

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    trustedOrigins: [
      siteUrl,
      nativeAppUrl,
      "exp://",
      "exp://**",
      "exp://192.168.*.*:*/**",
      "exp://172.35.1.51:8081",
      ...additionalOrigins,
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      disableSignUp: true,
    },
    user: {
      additionalFields: {
        role: {
          type: ["port_admin", "terminal_operator", "carrier"],
          defaultValue: "carrier",
          input: false,
        },
      },
    },
    plugins: [
      expo(),
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
      adminPlugin({
        adminRoles: ["port_admin"],
        ac: ac,
        roles: {
          port_admin,
          terminal_operator,
          carrier,
        },
      }),
    ],
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx));
export type User = ReturnType<typeof createAuth>["$Infer"]["Session"]["user"];

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(
      ctx as unknown as GenericCtx<DataModel>,
    );
  },
});
