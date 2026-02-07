"use client";

import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExpandIcon } from "lucide-react";
import type { ToolSummary } from "../types";

interface ToolSummaryWrapperProps {
  summary: ToolSummary;
  toolName: string;
  icon?: ReactNode;
  onExpand: () => void;
  children: ReactNode;
}

/**
 * Wrapper component that adds summary header and expand functionality
 */
export function ToolSummaryWrapper({
  summary,
  icon,
  onExpand,
  children,
}: ToolSummaryWrapperProps) {
  const hasMore = summary.count > summary.previewItems.length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          <span>{summary.label}</span>
          {hasMore && (
            <Badge variant="secondary" className="text-xs">
              {summary.count} total
            </Badge>
          )}
        </CardTitle>
        {hasMore && (
          <CardAction>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onExpand}
              title="Voir tout"
            >
              <ExpandIcon className="size-4" />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      {children}
    </Card>
  );
}
