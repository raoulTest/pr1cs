import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "./chart-card";
import { hourlyDistributionChartConfig } from "../lib/chart-configs";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface HourlyDistributionChartProps {
  terminalId?: Id<"terminals">;
  date?: string;
}

export function HourlyDistributionChart({
  terminalId,
  date,
}: HourlyDistributionChartProps) {
  const data = useQuery(api.analytics.queries.getHourlyDistribution, {
    terminalId,
    date,
  });

  const isLoading = data === undefined;
  const isEmpty = !data || data.every((d) => d.bookings === 0);

  return (
    <ChartCard
      title="Distribution horaire"
      description="Réservations par heure de la journée"
      isLoading={isLoading}
      isEmpty={isEmpty}
    >
      <ChartContainer config={hourlyDistributionChartConfig} className="h-[250px] w-full">
        <BarChart data={data} accessibilityLayer>
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
          <Bar
            dataKey="bookings"
            fill="var(--color-bookings)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
