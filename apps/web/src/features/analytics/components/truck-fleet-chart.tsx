import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ChartCard } from "./chart-card";
import { truckFleetChartConfig, TRUCK_TYPE_LABELS } from "../lib/chart-configs";

export function TruckFleetChart() {
  const data = useQuery(api.analytics.queries.getTruckStats, {});

  const isLoading = data === undefined;
  const isEmpty = !data || data.byTypeAndClass.length === 0;

  const chartData = data?.byTypeAndClass.map((d) => ({
    ...d,
    label: TRUCK_TYPE_LABELS[d.type] ?? d.type,
  }));

  return (
    <ChartCard
      title="Flotte de camions"
      description="Par type et classe de poids"
      isLoading={isLoading}
      isEmpty={isEmpty}
    >
      <ChartContainer config={truckFleetChartConfig} className="h-[250px] w-full">
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
          <Bar
            dataKey="light"
            stackId="a"
            fill="var(--color-light)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="medium"
            stackId="a"
            fill="var(--color-medium)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="heavy"
            stackId="a"
            fill="var(--color-heavy)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="super_heavy"
            stackId="a"
            fill="var(--color-super_heavy)"
            radius={[4, 4, 0, 0]}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
