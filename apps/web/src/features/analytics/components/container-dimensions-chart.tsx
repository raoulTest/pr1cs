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
  containerDimensionsChartConfig,
  CONTAINER_DIMENSION_LABELS,
} from "../lib/chart-configs";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface ContainerDimensionsChartProps {
  terminalId?: Id<"terminals">;
}

export function ContainerDimensionsChart({
  terminalId,
}: ContainerDimensionsChartProps) {
  const data = useQuery(api.analytics.queries.getContainerStats, {
    terminalId,
  });

  const isLoading = data === undefined;
  const isEmpty = !data || data.byDimensions.length === 0;

  const chartData = data?.byDimensions.map((d) => ({
    ...d,
    label: CONTAINER_DIMENSION_LABELS[d.dimensions] ?? d.dimensions,
    fill: `var(--color-${d.dimensions})`,
  }));

  return (
    <ChartCard
      title="Dimensions des conteneurs"
      description="Répartition par taille"
      isLoading={isLoading}
      isEmpty={isEmpty}
    >
      <ChartContainer config={containerDimensionsChartConfig} className="h-[250px] w-full">
        <BarChart data={chartData} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData?.map((entry) => (
              <Cell key={entry.dimensions} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
