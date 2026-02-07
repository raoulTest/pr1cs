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
 */
export const TOOL_RENDERERS: Record<string, ComponentType<ToolRendererProps>> = {
  // Booking tools
  listMyBookings: BookingListRenderer,
  getBookingDetails: BookingDetailsRenderer,
  listBookingsByTerminal: BookingListRenderer,
  listBookingsByCarrier: BookingListRenderer,
  listPendingBookings: BookingListRenderer,

  // Terminal tools
  listTerminals: TerminalListRenderer,
  getTerminalDetails: TerminalListRenderer,
  getAvailableSlots: SlotAvailabilityRenderer,

  // Container & Truck tools
  listMyContainers: ContainerListRenderer,
  getContainerDetails: ContainerListRenderer,
  listMyTrucks: TruckListRenderer,

  // Config
  getSystemConfig: SystemConfigRenderer,

  // Booking mutations
  createBookingViaAI: BookingConfirmationRenderer,
  cancelBookingViaAI: BookingConfirmationRenderer,

  // Suggestions
  suggestOptimalSlots: SlotAvailabilityRenderer,
};

/**
 * Get the appropriate renderer for a tool.
 * Falls back to generic renderer if no specific one exists.
 */
export function getToolRenderer(toolName: string): ComponentType<ToolRendererProps> {
  return TOOL_RENDERERS[toolName] ?? GenericToolRenderer;
}
