/**
 * Tool Renderer Registry
 *
 * Maps tool names to their respective renderer components.
 * These renderers display tool call results inline in the chat.
 */
import type { ComponentType } from "react";
import { BookingListRenderer } from "./components/booking-list";
import { BookingDetailsRenderer } from "./components/booking-details";
import { TerminalListRenderer } from "./components/terminal-list";
import { SlotAvailabilityRenderer } from "./components/slot-availability";
import { BookingConfirmationRenderer } from "./components/booking-confirmation";
import { ContainerListRenderer } from "./components/container-list";
import { TruckListRenderer } from "./components/truck-list";
import { SystemConfigRenderer } from "./components/system-config";
import { GenericToolRenderer } from "./components/generic-tool";

export interface ToolRendererProps<T = unknown> {
  toolName: string;
  args: Record<string, unknown>;
  result: T;
  state: "running" | "result" | "error";
}

/**
 * Registry of tool renderers by tool name.
 * eslint-disable-next-line @typescript-eslint/no-explicit-any
 */
export const TOOL_RENDERERS: Record<string, ComponentType<ToolRendererProps<unknown>>> = {
  // Booking tools
  listMyBookings: BookingListRenderer as ComponentType<ToolRendererProps<unknown>>,
  getBookingDetails: BookingDetailsRenderer as ComponentType<ToolRendererProps<unknown>>,
  listBookingsByTerminal: BookingListRenderer as ComponentType<ToolRendererProps<unknown>>,
  listBookingsByCarrier: BookingListRenderer as ComponentType<ToolRendererProps<unknown>>,
  listPendingBookings: BookingListRenderer as ComponentType<ToolRendererProps<unknown>>,

  // Terminal tools
  listTerminals: TerminalListRenderer as ComponentType<ToolRendererProps<unknown>>,
  getTerminalDetails: TerminalListRenderer as ComponentType<ToolRendererProps<unknown>>,
  getAvailableSlots: SlotAvailabilityRenderer as ComponentType<ToolRendererProps<unknown>>,

  // Container & Truck tools
  listMyContainers: ContainerListRenderer as ComponentType<ToolRendererProps<unknown>>,
  getContainerDetails: ContainerListRenderer as ComponentType<ToolRendererProps<unknown>>,
  listMyTrucks: TruckListRenderer as ComponentType<ToolRendererProps<unknown>>,

  // Config
  getSystemConfig: SystemConfigRenderer as ComponentType<ToolRendererProps<unknown>>,

  // Booking mutations
  createBookingViaAI: BookingConfirmationRenderer as ComponentType<ToolRendererProps<unknown>>,
  cancelBookingViaAI: BookingConfirmationRenderer as ComponentType<ToolRendererProps<unknown>>,

  // Suggestions
  suggestOptimalSlots: SlotAvailabilityRenderer as ComponentType<ToolRendererProps<unknown>>,
};

/**
 * Get the appropriate renderer for a tool.
 * Falls back to generic renderer if no specific one exists.
 */
export function getToolRenderer(toolName: string): ComponentType<ToolRendererProps> {
  return TOOL_RENDERERS[toolName] ?? GenericToolRenderer;
}
