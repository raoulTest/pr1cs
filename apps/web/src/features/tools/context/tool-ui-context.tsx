"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  ExpandSheetData,
  ConfirmationData,
  ToolSelection,
  ToolAction,
  ToolUIContextValue,
} from "../types";

const ToolUIContext = createContext<ToolUIContextValue | null>(null);

/**
 * Hook to access the Tool UI context
 */
export function useToolUI(): ToolUIContextValue {
  const ctx = useContext(ToolUIContext);
  if (!ctx) {
    throw new Error("useToolUI must be used within a ToolUIProvider");
  }
  return ctx;
}

/**
 * Optional hook that returns null if not in a provider
 */
export function useToolUIOptional(): ToolUIContextValue | null {
  return useContext(ToolUIContext);
}

interface ToolUIProviderProps {
  children: ReactNode;
  onSendMessage: (message: string) => void;
}

/**
 * Provider for Tool UI functionality
 *
 * Manages:
 * - Expand sheet state
 * - Confirmation dialog state
 * - Message sending to AI
 * - Action/selection handling
 */
export function ToolUIProvider({
  children,
  onSendMessage,
}: ToolUIProviderProps) {
  const [expandSheet, setExpandSheet] = useState<ExpandSheetData | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(
    null
  );

  const openExpandSheet = useCallback((data: ExpandSheetData) => {
    setExpandSheet(data);
  }, []);

  const closeExpandSheet = useCallback(() => {
    setExpandSheet(null);
  }, []);

  const showConfirmation = useCallback((data: ConfirmationData) => {
    setConfirmation(data);
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  const handleSelection = useCallback(
    (selection: ToolSelection) => {
      onSendMessage(selection.messageToSend);
    },
    [onSendMessage]
  );

  const handleAction = useCallback(
    (action: ToolAction) => {
      switch (action.type) {
        case "cancel-booking":
          showConfirmation({
            title: "Annuler la reservation",
            description: "Etes-vous sur de vouloir annuler cette reservation ?",
            action,
            details: [
              {
                label: "Reference",
                value: action.payload.bookingReference as string,
              },
            ],
            onConfirm: () => {
              onSendMessage(
                `Annule la reservation ${action.payload.bookingReference}`
              );
              closeConfirmation();
            },
            onCancel: closeConfirmation,
          });
          break;

        case "view-details":
          if (action.payload.bookingReference) {
            onSendMessage(
              `Montre-moi les details de la reservation ${action.payload.bookingReference}`
            );
          } else if (action.payload.terminalCode) {
            onSendMessage(
              `Montre-moi les details du terminal ${action.payload.terminalCode}`
            );
          } else if (action.payload.containerNumber) {
            onSendMessage(
              `Montre-moi les details du conteneur ${action.payload.containerNumber}`
            );
          } else if (action.payload.licensePlate) {
            onSendMessage(
              `Montre-moi les details du camion ${action.payload.licensePlate}`
            );
          }
          break;

        case "confirm-booking":
          showConfirmation({
            title: "Confirmer la reservation",
            description: "Voulez-vous confirmer cette reservation ?",
            action,
            details: Object.entries(action.payload)
              .filter(([, value]) => value != null)
              .map(([key, value]) => ({
                label: key,
                value: String(value),
              })),
            onConfirm: () => {
              // The action payload should contain all booking details
              const details = Object.entries(action.payload)
                .filter(([, value]) => value != null)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ");
              onSendMessage(`Confirme la reservation avec ${details}`);
              closeConfirmation();
            },
            onCancel: closeConfirmation,
          });
          break;

        case "retry":
          // Retry by asking the same thing again
          if (action.payload.originalRequest) {
            onSendMessage(action.payload.originalRequest as string);
          }
          break;

        case "expand":
          // Handled by component directly via openExpandSheet
          break;

        default:
          console.warn("Unhandled action type:", action.type);
      }
    },
    [onSendMessage, showConfirmation, closeConfirmation]
  );

  return (
    <ToolUIContext.Provider
      value={{
        expandSheet,
        openExpandSheet,
        closeExpandSheet,
        confirmation,
        showConfirmation,
        closeConfirmation,
        sendMessage: onSendMessage,
        handleSelection,
        handleAction,
      }}
    >
      {children}
    </ToolUIContext.Provider>
  );
}
