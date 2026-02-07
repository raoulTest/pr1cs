import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PageLayout } from "@/components/shared/page-layout";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export const Route = createFileRoute("/operator")({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <PageLayout role="operator">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </PageLayout>
  ),
});
