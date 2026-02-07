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
import { terminalComparisonChartConfig } from "../lib/chart-configs";

export function TerminalComparisonChart() {
  const data = useQuery(api.analytics.queries.getTerminalComparison, {});

  const isLoading = data === undefined;
  const isEmpty = !data || data.length === 0;

  return (
    <ChartCard
      title="Comparaison des terminaux"
      description="Volume de réservations par terminal"
      isLoading={isLoading}
      isEmpty={isEmpty}
      className="md:col-span-2"
    >
      <ChartContainer config={terminalComparisonChartConfig} className="h-[250px] w-full">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="terminalCode"
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
            dataKey="confirmed"
            fill="var(--color-confirmed)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="pending"
            fill="var(--color-pending)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="rejected"
            fill="var(--color-rejected)"
            radius={[4, 4, 0, 0]}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
