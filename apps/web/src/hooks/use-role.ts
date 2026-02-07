import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";

export type ApcsRole = "port_admin" | "terminal_operator" | "carrier";

export interface CurrentUser {
  _id: string;
  email: string;
  name?: string;
  image?: string;
  role?: ApcsRole;
}

export function useCurrentUser() {
  const user = useQuery(api.auth.getCurrentUser);
  return user as CurrentUser | null | undefined;
}

export function useRole(): ApcsRole | null | undefined {
  const user = useCurrentUser();
  
  if (user === undefined) return undefined; // Loading
  if (user === null) return null; // Not authenticated
  
  return user.role ?? null;
}

export function useIsAdmin(): boolean {
  const role = useRole();
  return role === "port_admin";
}

export function useIsOperator(): boolean {
  const role = useRole();
  return role === "terminal_operator";
}

export function useIsCarrier(): boolean {
  const role = useRole();
  return role === "carrier";
}
