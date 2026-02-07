/**
 * Audit Helper
 *
 * Provides a convenient helper function to log actions to the audit trail.
 * Handles sanitization of sensitive data before logging.
 */
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";

/** Audit action types (matching schema) */
export type AuditAction =
  | "query"
  | "mutation"
  | "ai_tool_call"
  | "login"
  | "logout"
  | "failed_auth"
  | "permission_denied";

export interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  args?: Record<string, unknown>;
  result?: string;
  errorMessage?: string;
  aiThreadId?: string;
  aiToolName?: string;
  durationMs?: number;
}

/**
 * Log action to audit trail
 * Call this from mutations after performing the action
 */
export async function logAudit(
  ctx: MutationCtx,
  params: AuditLogParams
): Promise<void> {
  // Sanitize args (remove sensitive data)
  const sanitizedArgs = params.args
    ? JSON.stringify(sanitizeArgs(params.args))
    : undefined;

  await ctx.runMutation(internal.audit.mutations.log, {
    userId: params.userId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    args: sanitizedArgs,
    result: params.result,
    errorMessage: params.errorMessage,
    aiThreadId: params.aiThreadId,
    aiToolName: params.aiToolName,
    durationMs: params.durationMs,
  });
}

/**
 * Remove sensitive fields from args before logging
 */
function sanitizeArgs(
  args: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "driverIdNumber",
    "idNumber",
    "ssn",
    "creditCard",
    "credit_card",
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    if (
      sensitiveFields.some((f) => key.toLowerCase().includes(f.toLowerCase()))
    ) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeArgs(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
