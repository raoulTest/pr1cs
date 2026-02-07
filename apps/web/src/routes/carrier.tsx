import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PageLayout } from "@/components/shared/page-layout";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export const Route = createFileRoute("/carrier")({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <PageLayout role="carrier">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </PageLayout>
  ),
});
