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
import { operationsChartConfig, OPERATION_LABELS } from "../lib/chart-configs";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface OperationsBalanceChartProps {
  terminalId?: Id<"terminals">;
}

export function OperationsBalanceChart({
  terminalId,
}: OperationsBalanceChartProps) {
  const data = useQuery(api.analytics.queries.getContainerStats, {
    terminalId,
  });

  const isLoading = data === undefined;
  const isEmpty = !data || data.byOperation.length === 0;

  const chartData = data?.byOperation.map((d) => ({
    name: d.operation,
    value: d.count,
    fill: `var(--color-${d.operation})`,
  }));

  const total = chartData?.reduce((sum, d) => sum + d.value, 0) ?? 0;

  return (
    <ChartCard
      title="Balance des opérations"
      description={total > 0 ? `${total} conteneurs` : undefined}
      isLoading={isLoading}
      isEmpty={isEmpty}
    >
      <ChartContainer config={operationsChartConfig} className="mx-auto h-[250px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="name"
                formatter={(value, name) => (
                  <span>
                    {OPERATION_LABELS[name as string] ?? name}: {String(value)}
                  </span>
                )}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            strokeWidth={2}
          >
            {chartData?.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}
