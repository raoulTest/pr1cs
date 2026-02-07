"use client";

import type { ReactNode } from "react";
import { useRole, type ApcsRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ApcsRole[];
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  loadingFallback,
}: RoleGuardProps) {
  const role = useRole();

  // Loading state
  if (role === undefined) {
    return loadingFallback ?? (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  // Not authenticated or no role
  if (role === null) {
    return <>{fallback}</>;
  }

  // Check if role is allowed
  if (!allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["port_admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function OperatorOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["terminal_operator"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function CarrierOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["carrier"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
