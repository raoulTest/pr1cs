/**
 * RBAC Permission System for APCS
 * Handles authentication and authorization checks
 */
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { ApcsRole } from "./validators";
import { authComponent } from "../auth";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "../_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

/** User ID type - stored as string since user table is in Better Auth component */
export type UserId = string;

export type AuthenticatedUser = {
  userId: UserId;
  email: string;
  name: string | undefined;
  apcsRole: ApcsRole | null;
  carrierCompanyId: Id<"carrierCompanies"> | null;
  isCompanyAdmin: boolean;
};

export type PermissionContext = QueryCtx | MutationCtx;

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Get the currently authenticated user with their APCS role and carrier association
 * Throws if not authenticated
 */
export async function getAuthenticatedUser(
  ctx: PermissionContext
): Promise<AuthenticatedUser> {
  const authUser = await authComponent.safeGetAuthUser(
    ctx as unknown as GenericCtx<DataModel>
  );

  if (!authUser) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  // Get extended profile
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", authUser._id))
    .unique();

  // Get carrier association if applicable
  let carrierCompanyId: Id<"carrierCompanies"> | null = null;
  let isCompanyAdmin = false;

  if (profile?.apcsRole === "carrier") {
    const carrierUser = await ctx.db
      .query("carrierUsers")
      .withIndex("by_user", (q) => q.eq("userId", authUser._id))
      .unique();

    if (carrierUser?.isActive) {
      carrierCompanyId = carrierUser.carrierCompanyId;
      isCompanyAdmin = carrierUser.isCompanyAdmin;
    }
  }

  return {
    userId: authUser._id as unknown as string,
    email: authUser.email,
    name: authUser.name,
    apcsRole: profile?.apcsRole ?? null,
    carrierCompanyId,
    isCompanyAdmin,
  };
}

/**
 * Optionally get the authenticated user (returns null if not authenticated)
 */
export async function getOptionalAuthenticatedUser(
  ctx: PermissionContext
): Promise<AuthenticatedUser | null> {
  try {
    return await getAuthenticatedUser(ctx);
  } catch {
    return null;
  }
}

// ============================================================================
// ROLE CHECKS
// ============================================================================

/**
 * Require the user to have one of the specified APCS roles
 * Throws FORBIDDEN if not authorized
 */
export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: ApcsRole[]
): void {
  if (!user.apcsRole || !allowedRoles.includes(user.apcsRole)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `This action requires one of the following roles: ${allowedRoles.join(", ")}`,
    });
  }
}

/**
 * Require the user to have an APCS role (any role)
 */
export function requireAnyRole(user: AuthenticatedUser): void {
  if (!user.apcsRole) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "You must have an APCS role assigned to perform this action",
    });
  }
}

/**
 * Check if user is a port admin
 */
export function isPortAdmin(user: AuthenticatedUser): boolean {
  return user.apcsRole === "port_admin";
}

/**
 * Check if user is a terminal operator
 */
export function isTerminalOperator(user: AuthenticatedUser): boolean {
  return user.apcsRole === "terminal_operator";
}

/**
 * Check if user is a carrier
 */
export function isCarrier(user: AuthenticatedUser): boolean {
  return user.apcsRole === "carrier";
}

// ============================================================================
// TERMINAL ACCESS CHECKS
// ============================================================================

/**
 * Check if user can manage a specific terminal
 * Port admins can manage all terminals
 * Terminal operators can only manage assigned terminals
 */
export async function canManageTerminal(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  terminalId: Id<"terminals">
): Promise<boolean> {
  // Port admins can manage all terminals
  if (user.apcsRole === "port_admin") {
    return true;
  }

  // Terminal operators can only manage assigned terminals
  if (user.apcsRole === "terminal_operator") {
    const assignment = await ctx.db
      .query("terminalOperatorAssignments")
      .withIndex("by_user_and_terminal", (q) =>
        q.eq("userId", user.userId).eq("terminalId", terminalId)
      )
      .unique();

    return assignment?.isActive ?? false;
  }

  return false;
}

/**
 * Require that user can manage a specific terminal
 * Throws FORBIDDEN if not authorized
 */
export async function requireTerminalAccess(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  terminalId: Id<"terminals">
): Promise<void> {
  const canManage = await canManageTerminal(ctx, user, terminalId);
  if (!canManage) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "You do not have access to this terminal",
    });
  }
}

/**
 * Get all terminal IDs that a user can manage
 */
export async function getManagedTerminalIds(
  ctx: PermissionContext,
  user: AuthenticatedUser
): Promise<Id<"terminals">[]> {
  // Port admins can manage all terminals
  if (user.apcsRole === "port_admin") {
    const terminals = await ctx.db.query("terminals").collect();
    return terminals.map((t) => t._id);
  }

  // Terminal operators can only manage assigned terminals
  if (user.apcsRole === "terminal_operator") {
    const assignments = await ctx.db
      .query("terminalOperatorAssignments")
      .withIndex("by_user_and_active", (q) =>
        q.eq("userId", user.userId).eq("isActive", true)
      )
      .collect();

    return assignments.map((a) => a.terminalId);
  }

  return [];
}

// ============================================================================
// CARRIER ACCESS CHECKS
// ============================================================================

/**
 * Check if user can manage a specific carrier company
 * Port admins can manage all carriers
 * Carrier company admins can manage their own company
 */
export async function canManageCarrier(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  carrierCompanyId: Id<"carrierCompanies">
): Promise<boolean> {
  // Port admins can manage all carriers
  if (user.apcsRole === "port_admin") {
    return true;
  }

  // Carrier users can only manage their own company if they're company admin
  if (user.apcsRole === "carrier") {
    return (
      user.carrierCompanyId === carrierCompanyId && user.isCompanyAdmin === true
    );
  }

  return false;
}

/**
 * Check if user can view a specific carrier company's data
 * Port admins can view all
 * All carrier users can view their own company
 */
export async function canViewCarrier(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  carrierCompanyId: Id<"carrierCompanies">
): Promise<boolean> {
  // Port admins can view all carriers
  if (user.apcsRole === "port_admin") {
    return true;
  }

  // All carrier users can view their own company
  if (user.apcsRole === "carrier") {
    return user.carrierCompanyId === carrierCompanyId;
  }

  return false;
}

/**
 * Require that user can manage a specific carrier company
 */
export async function requireCarrierManagement(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  carrierCompanyId: Id<"carrierCompanies">
): Promise<void> {
  const canManage = await canManageCarrier(ctx, user, carrierCompanyId);
  if (!canManage) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "You do not have permission to manage this carrier company",
    });
  }
}

// ============================================================================
// TRUCK ACCESS CHECKS
// ============================================================================

/**
 * Check if user can manage a specific truck
 */
export async function canManageTruck(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  truckId: Id<"trucks">
): Promise<boolean> {
  const truck = await ctx.db.get(truckId);
  if (!truck) return false;

  return canManageCarrier(ctx, user, truck.carrierCompanyId);
}

/**
 * Check if user can view a specific truck
 */
export async function canViewTruck(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  truckId: Id<"trucks">
): Promise<boolean> {
  const truck = await ctx.db.get(truckId);
  if (!truck) return false;

  return canViewCarrier(ctx, user, truck.carrierCompanyId);
}

/**
 * Require that user can manage a specific truck
 */
export async function requireTruckAccess(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  truckId: Id<"trucks">
): Promise<void> {
  const canManage = await canManageTruck(ctx, user, truckId);
  if (!canManage) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "You do not have permission to manage this truck",
    });
  }
}

// ============================================================================
// BOOKING ACCESS CHECKS
// ============================================================================

/**
 * Check if user can view a specific booking
 */
export async function canViewBooking(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  bookingId: Id<"bookings">
): Promise<boolean> {
  const booking = await ctx.db.get(bookingId);
  if (!booking) return false;

  // Port admins can view all
  if (user.apcsRole === "port_admin") {
    return true;
  }

  // Terminal operators can view bookings for their terminals
  if (user.apcsRole === "terminal_operator") {
    return canManageTerminal(ctx, user, booking.terminalId);
  }

  // Carriers can view their own bookings
  if (user.apcsRole === "carrier") {
    return booking.carrierCompanyId === user.carrierCompanyId;
  }

  return false;
}

/**
 * Check if user can modify a specific booking's status
 */
export async function canModifyBookingStatus(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  bookingId: Id<"bookings">,
  newStatus: string
): Promise<boolean> {
  const booking = await ctx.db.get(bookingId);
  if (!booking) return false;

  // For cancellation, carriers can cancel their own bookings
  if (newStatus === "cancelled") {
    if (
      user.apcsRole === "carrier" &&
      booking.carrierCompanyId === user.carrierCompanyId
    ) {
      return true;
    }
  }

  // For confirm/reject/consume, must be terminal operator or admin
  if (["confirmed", "rejected", "consumed"].includes(newStatus)) {
    if (user.apcsRole === "port_admin") {
      return true;
    }
    if (user.apcsRole === "terminal_operator") {
      return canManageTerminal(ctx, user, booking.terminalId);
    }
  }

  return false;
}

/**
 * Require that user can view a specific booking
 */
export async function requireBookingView(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  bookingId: Id<"bookings">
): Promise<void> {
  const canView = await canViewBooking(ctx, user, bookingId);
  if (!canView) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "You do not have access to this booking",
    });
  }
}
