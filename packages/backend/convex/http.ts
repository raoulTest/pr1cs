import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Register Better Auth routes
authComponent.registerRoutes(http, createAuth);

// --- CORS helper for custom endpoints ---

// Parse allowed origins from env (comma-separated) or use defaults
const getAllowedOrigins = (): string[] => {
  const siteUrl = process.env.SITE_URL;
  const trustedOrigins = process.env.TRUSTED_ORIGINS;

  const origins: string[] = [];

  if (siteUrl) origins.push(siteUrl);
  if (trustedOrigins) {
    origins.push(...trustedOrigins.split(",").map((o) => o.trim()));
  }

  return origins;
};

// Check if origin is allowed (supports wildcards like *.example.com)
const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  return allowedOrigins.some((allowed) => {
    // Exact match
    if (allowed === origin) return true;

    // Wildcard match (e.g., "*.example.com")
    if (allowed.includes("*")) {
      const pattern = allowed
        .replace(/\./g, "\\.")
        .replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`).test(origin);
    }

    return false;
  });
};

// Get CORS headers for a request
const getCorsHeaders = (request: Request): HeadersInit => {
  const origin = request.headers.get("Origin");
  const allowedOrigin = isOriginAllowed(origin) ? origin! : "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
};

// Export for use in custom endpoints
export { getCorsHeaders, isOriginAllowed };

// --- Example custom endpoint with CORS ---

// http.route({
//   path: "/api/example",
//   method: "OPTIONS",
//   handler: httpAction(async (_, request) => {
//     return new Response(null, {
//       status: 204,
//       headers: getCorsHeaders(request),
//     });
//   }),
// });

// http.route({
//   path: "/api/example",
//   method: "GET",
//   handler: httpAction(async (ctx, request) => {
//     return new Response(
//       JSON.stringify({ message: "Hello from Convex!" }),
//       {
//         status: 200,
//         headers: {
//           "Content-Type": "application/json",
//           ...getCorsHeaders(request),
//         },
//       }
//     );
//   }),
// });

export default http;
