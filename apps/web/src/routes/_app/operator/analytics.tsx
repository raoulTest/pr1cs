import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/features/analytics";

export const Route = createFileRoute("/_app/operator/analytics")({
  component: OperatorAnalytics,
});

function OperatorAnalytics() {
  return <AnalyticsPage role="terminal_operator" />;
}
