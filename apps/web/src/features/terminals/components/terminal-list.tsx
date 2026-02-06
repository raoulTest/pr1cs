import { api } from "@microhack/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { RiAddLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TerminalListProps {
  onCreateClick?: () => void;
  onTerminalClick?: (terminalId: string) => void;
}

export function TerminalList({ onCreateClick, onTerminalClick }: TerminalListProps) {
  const terminals = useQuery(api.terminals.queries.list, {});

  if (terminals === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Terminals</h2>
          <p className="text-muted-foreground">
            Manage port terminals and their gates
          </p>
        </div>
        <Button onClick={onCreateClick}>
          <RiAddLine className="mr-2 size-4" />
          Add Terminal
        </Button>
      </div>

      {terminals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No terminals yet</p>
            <Button onClick={onCreateClick}>
              <RiAddLine className="mr-2 size-4" />
              Create your first terminal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {terminals.map((terminal) => (
            <Card
              key={terminal._id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTerminalClick?.(terminal._id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{terminal.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {terminal.code}
                    </CardDescription>
                  </div>
                  <Badge variant={terminal.isActive ? "default" : "secondary"}>
                    {terminal.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Gates:</span>{" "}
                    <span className="font-medium">{terminal.gateCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timezone:</span>{" "}
                    <span className="font-medium text-xs">{terminal.timezone.split("/")[1]}</span>
                  </div>
                  {terminal.address && (
                    <div className="col-span-2 truncate">
                      <span className="text-muted-foreground">Address:</span>{" "}
                      <span className="font-medium">{terminal.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
