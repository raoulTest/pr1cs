import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface GateListProps {
  onCreateClick?: () => void;
}

export function GateList({ onCreateClick }: GateListProps) {
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>("");
  
  const terminals = useQuery(api.terminals.queries.list, { activeOnly: true });
  const gates = useQuery(
    api.gates.queries.listByTerminal,
    selectedTerminalId
      ? { terminalId: selectedTerminalId as Id<"terminals"> }
      : "skip"
  );

  if (terminals === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-64" />
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
          <h2 className="text-2xl font-bold tracking-tight">Gates</h2>
          <p className="text-muted-foreground">
            Manage terminal gates and their configurations
          </p>
        </div>
        <Button onClick={onCreateClick}>
          <RiAddLine className="mr-2 size-4" />
          Add Gate
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a terminal to view gates" />
            </SelectTrigger>
            <SelectContent>
              {terminals.map((terminal) => (
                <SelectItem key={terminal._id} value={terminal._id}>
                  {terminal.name} ({terminal.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedTerminalId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Select a terminal above to view its gates
            </p>
          </CardContent>
        </Card>
      ) : gates === undefined ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : gates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No gates found for this terminal
            </p>
            <Button onClick={onCreateClick}>
              <RiAddLine className="mr-2 size-4" />
              Create first gate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gates.map((gate) => (
            <Card key={gate._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{gate.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {gate.code}
                    </CardDescription>
                  </div>
                  <Badge variant={gate.isActive ? "default" : "secondary"}>
                    {gate.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {gate.description && (
                    <div className="text-muted-foreground text-xs">
                      {gate.description}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {gate.allowedTruckTypes.slice(0, 3).map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                    {gate.allowedTruckTypes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{gate.allowedTruckTypes.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
