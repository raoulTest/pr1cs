import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";

/**
 * Unified authenticated app layout
 * All authenticated routes go through this layout
 * The sidebar shows role-based navigation + chat threads
 */
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
