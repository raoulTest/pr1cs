import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "./chart-card";
import { systemActivityChartConfig } from "../lib/chart-configs";

export function SystemActivityChart() {
  const data = useQuery(api.audit.queries.getStats, {});

  const isLoading = data === undefined;
  const isEmpty =
    !data || data.recentActivity.every((d) => d.count === 0);

  const chartData = data?.recentActivity.map((d) => ({
    ...d,
    label: `${d.hour.toString().padStart(2, "0")}:00`,
  }));

  return (
    <ChartCard
      title="Activité système"
      description="Actions par heure (dernières 24h)"
      isLoading={isLoading}
      isEmpty={isEmpty}
      className="md:col-span-2 lg:col-span-3"
    >
      <ChartContainer config={systemActivityChartConfig} className="h-[250px] w-full">
        <LineChart data={chartData} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={2}
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
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--color-count)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-count)" }}
          />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}
