"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuildingIcon } from "lucide-react";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface Terminal {
  _id: Id<"terminals">;
  name: string;
  code: string;
}

interface TerminalSelectorProps {
  terminals: Terminal[];
  selectedTerminalId: Id<"terminals"> | null;
  onSelect: (terminalId: Id<"terminals">) => void;
  disabled?: boolean;
}

export function TerminalSelector({
  terminals,
  selectedTerminalId,
  onSelect,
  disabled,
}: TerminalSelectorProps) {
  if (terminals.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BuildingIcon className="size-4" />
        <span>Aucun terminal disponible</span>
      </div>
    );
  }

  return (
    <Select
      value={selectedTerminalId ?? undefined}
      onValueChange={(value) => onSelect(value as Id<"terminals">)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[200px]">
        <BuildingIcon className="mr-2 size-4" />
        <SelectValue placeholder="Sélectionner un terminal" />
      </SelectTrigger>
      <SelectContent>
        {terminals.map((terminal) => (
          <SelectItem key={terminal._id} value={terminal._id}>
            {terminal.name} ({terminal.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
