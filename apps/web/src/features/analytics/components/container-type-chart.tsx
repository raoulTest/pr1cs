import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "./chart-card";
import {
  containerTypeChartConfig,
  CONTAINER_TYPE_LABELS,
} from "../lib/chart-configs";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface ContainerTypeChartProps {
  terminalId?: Id<"terminals">;
}

export function ContainerTypeChart({ terminalId }: ContainerTypeChartProps) {
  const data = useQuery(api.analytics.queries.getContainerStats, {
    terminalId,
  });

  const isLoading = data === undefined;
  const isEmpty = !data || data.byType.length === 0;

  const chartData = data?.byType.map((d) => ({
    ...d,
    label: CONTAINER_TYPE_LABELS[d.type] ?? d.type,
    fill: `var(--color-${d.type})`,
  }));

  return (
    <ChartCard
      title="Types de conteneurs"
      description="Répartition par type"
      isLoading={isLoading}
      isEmpty={isEmpty}
    >
      <ChartContainer config={containerTypeChartConfig} className="h-[250px] w-full">
        <BarChart data={chartData} layout="vertical" accessibilityLayer>
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={100}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData?.map((entry) => (
              <Cell key={entry.type} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
