import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ChartCard } from "./chart-card";
import { bookingTrendsChartConfig } from "../lib/chart-configs";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface BookingTrendsChartProps {
  terminalId?: Id<"terminals">;
  days?: number;
}

export function BookingTrendsChart({
  terminalId,
  days = 30,
}: BookingTrendsChartProps) {
  const data = useQuery(api.analytics.queries.getBookingTrends, {
    terminalId,
    days,
  });

  const isLoading = data === undefined;
  const isEmpty = !data || data.length === 0 || data.every((d) => d.total === 0);

  // Format date labels
  const chartData = data?.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  return (
    <ChartCard
      title="Tendances des réservations"
      description={`${days} derniers jours`}
      isLoading={isLoading}
      isEmpty={isEmpty}
      className="md:col-span-2"
    >
      <ChartContainer config={bookingTrendsChartConfig} className="h-[250px] w-full">
        <AreaChart data={chartData} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
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
          <Area
            type="monotone"
            dataKey="confirmed"
            stackId="1"
            fill="var(--color-confirmed)"
            stroke="var(--color-confirmed)"
            fillOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="consumed"
            stackId="1"
            fill="var(--color-consumed)"
            stroke="var(--color-consumed)"
            fillOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="pending"
            stackId="1"
            fill="var(--color-pending)"
            stroke="var(--color-pending)"
            fillOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="rejected"
            stackId="1"
            fill="var(--color-rejected)"
            stroke="var(--color-rejected)"
            fillOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="cancelled"
            stackId="1"
            fill="var(--color-cancelled)"
            stroke="var(--color-cancelled)"
            fillOpacity={0.4}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
