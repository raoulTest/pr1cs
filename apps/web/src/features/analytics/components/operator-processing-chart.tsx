import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ChartCard } from "./chart-card";
import { operatorProcessingChartConfig } from "../lib/chart-configs";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface OperatorProcessingChartProps {
  terminalId: Id<"terminals">;
}

export function OperatorProcessingChart({
  terminalId,
}: OperatorProcessingChartProps) {
  const data = useQuery(api.analytics.queries.getOperatorProcessing, {
    terminalId,
  });

  const isLoading = data === undefined;
  const isEmpty = !data || data.total === 0;

  const chartData =
    data && data.total > 0
      ? [
          {
            name: "autoValidated",
            value: data.autoValidated,
            fill: "var(--color-autoValidated)",
          },
          {
            name: "manuallyProcessed",
            value: data.manuallyProcessed,
            fill: "var(--color-manuallyProcessed)",
          },
        ].filter((d) => d.value > 0)
      : [];

  return (
    <ChartCard
      title="Traitement des réservations"
      description={data ? `${data.total} réservations traitées` : undefined}
      isLoading={isLoading}
      isEmpty={isEmpty}
    >
      <ChartContainer config={operatorProcessingChartConfig} className="mx-auto h-[250px]">
        <PieChart>
          <ChartTooltip
            content={<ChartTooltipContent nameKey="name" />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}
