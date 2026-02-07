import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

/**
 * Hook for managing terminal selection for operators
 * Persists selection in localStorage
 */
export function useTerminalSelector() {
  const terminals = useQuery(api.terminals.queries.list, { activeOnly: true });
  const [selectedTerminalId, setSelectedTerminalId] = useState<Id<"terminals"> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("apcs_selected_terminal");
    if (stored && terminals) {
      const exists = terminals.some((t) => t._id === stored);
      if (exists) {
        setSelectedTerminalId(stored as Id<"terminals">);
      }
    }
  }, [terminals]);

  // Auto-select first terminal if none selected
  useEffect(() => {
    if (!selectedTerminalId && terminals && terminals.length > 0) {
      setSelectedTerminalId(terminals[0]._id);
    }
  }, [terminals, selectedTerminalId]);

  // Persist selection
  const selectTerminal = (terminalId: Id<"terminals">) => {
    setSelectedTerminalId(terminalId);
    localStorage.setItem("apcs_selected_terminal", terminalId);
  };

  const selectedTerminal = terminals?.find((t) => t._id === selectedTerminalId);

  return {
    terminals: terminals ?? [],
    selectedTerminalId,
    selectedTerminal,
    selectTerminal,
    isLoading: terminals === undefined,
  };
}
