import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
  isEmpty?: boolean;
}

export function ChartCard({
  title,
  description,
  children,
  isLoading,
  className,
  isEmpty,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : isEmpty ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Aucune donnée disponible
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
