import { expo } from "@better-auth/expo";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  defaultRoles,
} from "better-auth/plugins/admin/access";
import { admin as adminPlugin } from "better-auth/plugins";

import authSchema from "./betterAuth/schema";

import type { DataModel } from "./_generated/dataModel";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;
const nativeAppUrl = process.env.NATIVE_APP_URL || "microhack://";

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
    verbose: false,
  },
);

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  ...adminAc.statements,
});

export const user = defaultRoles.user;

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
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    user: {
      additionalFields: {
        role: {
          type: ["admin", "user"],
          defaultValue: "user",
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
        adminRoles: ["admin"],
        ac: ac,
        roles: {
          admin,
          user,
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
