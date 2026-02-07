import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "./chart-card";
import type { ChartConfig } from "@/components/ui/chart";

const topCarriersChartConfig: ChartConfig = {
  bookingCount: {
    label: "Réservations",
    color: "var(--chart-1)",
  },
  containerCount: {
    label: "Conteneurs",
    color: "var(--chart-2)",
  },
};

export function TopCarriersChart() {
  const data = useQuery(api.analytics.queries.getTopCarriers, { limit: 10 });

  const isLoading = data === undefined;
  const isEmpty = !data || data.length === 0;

  const chartData = data?.map((d) => ({
    ...d,
    label: d.name ?? d.email ?? d.carrierId.slice(0, 8),
  }));

  return (
    <ChartCard
      title="Top transporteurs"
      description="Par volume de réservations"
      isLoading={isLoading}
      isEmpty={isEmpty}
    >
      <ChartContainer config={topCarriersChartConfig} className="h-[250px] w-full">
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
            width={120}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey="bookingCount"
            fill="var(--color-bookingCount)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
