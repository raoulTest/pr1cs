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
import { bookingStatusChartConfig, STATUS_LABELS } from "../lib/chart-configs";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface BookingStatusChartProps {
  terminalId?: Id<"terminals">;
  carrierId?: string;
}

export function BookingStatusChart({
  terminalId,
  carrierId,
}: BookingStatusChartProps) {
  const data = useQuery(api.bookings.queries.countByStatus, {
    terminalId,
    carrierId,
  });

  const isLoading = data === undefined;

  const chartData =
    data && data.total > 0
      ? [
          { name: "pending", value: data.pending, fill: "var(--color-pending)" },
          { name: "confirmed", value: data.confirmed, fill: "var(--color-confirmed)" },
          { name: "rejected", value: data.rejected, fill: "var(--color-rejected)" },
          { name: "consumed", value: data.consumed, fill: "var(--color-consumed)" },
          { name: "cancelled", value: data.cancelled, fill: "var(--color-cancelled)" },
          { name: "expired", value: data.expired, fill: "var(--color-expired)" },
        ].filter((d) => d.value > 0)
      : [];

  return (
    <ChartCard
      title="Répartition des statuts"
      description={data ? `${data.total} réservations au total` : undefined}
      isLoading={isLoading}
      isEmpty={chartData.length === 0}
    >
      <ChartContainer config={bookingStatusChartConfig} className="mx-auto h-[250px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="name"
                formatter={(value, name) => (
                  <span>
                    {STATUS_LABELS[name as string] ?? name}: {String(value)}
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
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
          />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}
