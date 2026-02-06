/**
 * RBAC Permission System for APCS
 * Handles authentication and authorization checks
 * 
 * Updated for new schema: 
 * - No more carrierCompanies/carrierUsers tables
 * - Trucks and containers are owned directly by carrier users
 * - Bookings use carrierId instead of carrierCompanyId
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
};

export type PermissionContext = QueryCtx | MutationCtx;

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Get the currently authenticated user with their APCS role
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

  // Role now comes from Better Auth user table
  // Map "user" role to null (no APCS privileges)
  const betterAuthRole = (authUser as unknown as { role: string }).role;
  const apcsRole: ApcsRole | null =
    betterAuthRole === "user" ? null : (betterAuthRole as ApcsRole);

  return {
    userId: authUser._id as unknown as string,
    email: authUser.email,
    name: authUser.name,
    apcsRole,
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
// CONTAINER ACCESS CHECKS
// ============================================================================

/**
 * Check if user can manage a specific container
 * Port admins can manage all containers
 * Carriers can only manage their own containers
 */
export async function canManageContainer(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  containerId: Id<"containers">
): Promise<boolean> {
  const container = await ctx.db.get(containerId);
  if (!container) return false;

  // Port admins can manage all containers
  if (user.apcsRole === "port_admin") {
    return true;
  }

  // Carriers can only manage their own containers
  if (user.apcsRole === "carrier") {
    return container.ownerId === user.userId;
  }

  return false;
}

/**
 * Check if user can view a specific container
 */
export async function canViewContainer(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  containerId: Id<"containers">
): Promise<boolean> {
  const container = await ctx.db.get(containerId);
  if (!container) return false;

  // Port admins can view all containers
  if (user.apcsRole === "port_admin") {
    return true;
  }

  // Carriers can only view their own containers
  if (user.apcsRole === "carrier") {
    return container.ownerId === user.userId;
  }

  return false;
}

/**
 * Require that user can manage a specific container
 */
export async function requireContainerAccess(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  containerId: Id<"containers">
): Promise<void> {
  const canManage = await canManageContainer(ctx, user, containerId);
  if (!canManage) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "You do not have permission to manage this container",
    });
  }
}

// ============================================================================
// TRUCK ACCESS CHECKS
// ============================================================================

/**
 * Check if user can manage a specific truck
 * Port admins can manage all trucks
 * Carriers can only manage their own trucks
 */
export async function canManageTruck(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  truckId: Id<"trucks">
): Promise<boolean> {
  const truck = await ctx.db.get(truckId);
  if (!truck) return false;

  // Port admins can manage all trucks
  if (user.apcsRole === "port_admin") {
    return true;
  }

  // Carriers can only manage their own trucks
  if (user.apcsRole === "carrier") {
    return truck.ownerId === user.userId;
  }

  return false;
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

  // Port admins can view all trucks
  if (user.apcsRole === "port_admin") {
    return true;
  }

  // Carriers can only view their own trucks
  if (user.apcsRole === "carrier") {
    return truck.ownerId === user.userId;
  }

  return false;
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
    return booking.carrierId === user.userId;
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

  // For cancellation, carriers can cancel their own bookings (anytime)
  if (newStatus === "cancelled") {
    if (user.apcsRole === "carrier" && booking.carrierId === user.userId) {
      return true;
    }
    // Operators and admins can also cancel
    if (user.apcsRole === "port_admin") {
      return true;
    }
    if (user.apcsRole === "terminal_operator") {
      return canManageTerminal(ctx, user, booking.terminalId);
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

/**
 * Check if user owns a specific booking
 */
export async function isBookingOwner(
  ctx: PermissionContext,
  user: AuthenticatedUser,
  bookingId: Id<"bookings">
): Promise<boolean> {
  const booking = await ctx.db.get(bookingId);
  if (!booking) return false;
  return booking.carrierId === user.userId;
}
