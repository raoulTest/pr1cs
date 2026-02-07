/**
 * Tool Renderer Registry
 *
 * Maps tool names to their respective renderer components and metadata.
 * These renderers display tool call results inline in the chat.
 */
import type { ComponentType } from "react";
import type {
  InteractiveToolRendererProps,
  ToolRendererMeta,
  ToolRendererProps,
} from "./types";
import { BookingListRenderer } from "./components/booking-list";
import { BookingDetailsRenderer } from "./components/booking-details";
import { TerminalListRenderer } from "./components/terminal-list";
import { SlotAvailabilityRenderer } from "./components/slot-availability";
import { BookingConfirmationRenderer } from "./components/booking-confirmation";
import { ContainerListRenderer } from "./components/container-list";
import { TruckListRenderer } from "./components/truck-list";
import { SystemConfigRenderer } from "./components/system-config";
import { GenericToolRenderer } from "./components/generic-tool";

// Re-export types for backward compatibility
export type { ToolRendererProps } from "./types";

/**
 * Registry of tool renderers by tool name.
 */
export const TOOL_RENDERERS: Record<
  string,
  ComponentType<ToolRendererProps<unknown>>
> = {
  // Booking tools
  listMyBookings: BookingListRenderer as ComponentType<ToolRendererProps<unknown>>,
  getBookingDetails: BookingDetailsRenderer as ComponentType<ToolRendererProps<unknown>>,
  listBookingsByTerminal: BookingListRenderer as ComponentType<ToolRendererProps<unknown>>,
  listBookingsByCarrier: BookingListRenderer as ComponentType<ToolRendererProps<unknown>>,
  listPendingBookings: BookingListRenderer as ComponentType<ToolRendererProps<unknown>>,
  listAllBookings: BookingListRenderer as ComponentType<ToolRendererProps<unknown>>,

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
 * Metadata for tool renderers (summary/expand behavior)
 */

// Helper to normalize booking results (handles both array and object formats)
function normalizeBookingResult(result: unknown): { bookings: unknown[]; total: number } {
  if (Array.isArray(result)) {
    return { bookings: result, total: result.length };
  }
  if (result && typeof result === "object" && "bookings" in result) {
    const r = result as { bookings?: unknown[]; total?: number };
    return { bookings: r.bookings || [], total: r.total || r.bookings?.length || 0 };
  }
  return { bookings: [], total: 0 };
}

// Helper to normalize terminal results
function normalizeTerminalResult(result: unknown): { terminals: unknown[] } {
  if (Array.isArray(result)) {
    return { terminals: result };
  }
  if (result && typeof result === "object") {
    const r = result as { terminals?: unknown[]; terminal?: unknown };
    if (r.terminals) return { terminals: r.terminals };
    if (r.terminal) return { terminals: [r.terminal] };
    if ("code" in result && "name" in result) return { terminals: [result] };
  }
  return { terminals: [] };
}

// Helper to normalize container results
function normalizeContainerResult(result: unknown): { containers: unknown[] } {
  if (Array.isArray(result)) {
    return { containers: result };
  }
  if (result && typeof result === "object") {
    const r = result as { containers?: unknown[]; container?: unknown };
    if (r.containers) return { containers: r.containers };
    if (r.container) return { containers: [r.container] };
    if ("containerNumber" in result) return { containers: [result] };
  }
  return { containers: [] };
}

// Helper to normalize truck results
function normalizeTruckResult(result: unknown): { trucks: unknown[] } {
  if (Array.isArray(result)) {
    return { trucks: result };
  }
  if (result && typeof result === "object") {
    const r = result as { trucks?: unknown[]; truck?: unknown };
    if (r.trucks) return { trucks: r.trucks };
    if (r.truck) return { trucks: [r.truck] };
    if ("licensePlate" in result) return { trucks: [result] };
  }
  return { trucks: [] };
}

// Helper to normalize slot results
function normalizeSlotResult(result: unknown): { slots: unknown[] } {
  if (result && typeof result === "object") {
    const r = result as { slots?: unknown[]; suggestions?: unknown[] };
    return { slots: r.slots || r.suggestions || [] };
  }
  return { slots: [] };
}

export const TOOL_META: Record<string, ToolRendererMeta<unknown>> = {
  listMyBookings: {
    component: BookingListRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeBookingResult(result);
      return {
        count: r.total,
        label: "Reservations",
        previewItems: r.bookings.slice(0, 3),
      };
    },
    getActions: () => [],
    isSelectable: false,
    previewCount: 3,
  },

  listBookingsByTerminal: {
    component: BookingListRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeBookingResult(result);
      return {
        count: r.total,
        label: "Reservations du terminal",
        previewItems: r.bookings.slice(0, 3),
      };
    },
    getActions: () => [],
    isSelectable: false,
    previewCount: 3,
  },

  listBookingsByCarrier: {
    component: BookingListRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeBookingResult(result);
      return {
        count: r.total,
        label: "Reservations du transporteur",
        previewItems: r.bookings.slice(0, 3),
      };
    },
    getActions: () => [],
    isSelectable: false,
    previewCount: 3,
  },

  listPendingBookings: {
    component: BookingListRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeBookingResult(result);
      return {
        count: r.total,
        label: "Reservations en attente",
        previewItems: r.bookings.slice(0, 3),
      };
    },
    getActions: () => [],
    isSelectable: false,
    previewCount: 3,
  },

  listAllBookings: {
    component: BookingListRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeBookingResult(result);
      return {
        count: r.total,
        label: "Toutes les reservations",
        previewItems: r.bookings.slice(0, 3),
      };
    },
    getActions: () => [],
    isSelectable: false,
    previewCount: 3,
  },

  getAvailableSlots: {
    component: SlotAvailabilityRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeSlotResult(result);
      return {
        count: r.slots.length,
        label: "Creneaux disponibles",
        previewItems: r.slots.slice(0, 6),
      };
    },
    getActions: () => [],
    isSelectable: true,
    formatSelectionMessage: (slot: unknown) => {
      const s = slot as { date?: string; startTime: string };
      if (!s.date) return `Je veux le creneau de ${s.startTime}`;
      const formattedDate = new Date(s.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      });
      return `Je veux le creneau de ${s.startTime} le ${formattedDate}`;
    },
    previewCount: 6,
  },

  suggestOptimalSlots: {
    component: SlotAvailabilityRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeSlotResult(result);
      return {
        count: r.slots.length,
        label: "Creneaux recommandes",
        previewItems: r.slots.slice(0, 6),
      };
    },
    getActions: () => [],
    isSelectable: true,
    formatSelectionMessage: (slot: unknown) => {
      const s = slot as { date?: string; startTime: string };
      if (!s.date) return `Je veux le creneau de ${s.startTime}`;
      const formattedDate = new Date(s.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      });
      return `Je veux le creneau de ${s.startTime} le ${formattedDate}`;
    },
    previewCount: 6,
  },

  listTerminals: {
    component: TerminalListRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeTerminalResult(result);
      return {
        count: r.terminals.length,
        label: "Terminaux",
        previewItems: r.terminals.slice(0, 3),
      };
    },
    getActions: () => [],
    isSelectable: true,
    formatSelectionMessage: (terminal: unknown) => {
      const t = terminal as { code: string; name: string };
      return `Je choisis le terminal ${t.code} (${t.name})`;
    },
    previewCount: 3,
  },

  listMyContainers: {
    component: ContainerListRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeContainerResult(result);
      return {
        count: r.containers.length,
        label: "Conteneurs",
        previewItems: r.containers.slice(0, 3),
      };
    },
    getActions: () => [],
    isSelectable: true,
    formatSelectionMessage: (container: unknown) => {
      const c = container as { containerNumber: string };
      return `Je choisis le conteneur ${c.containerNumber}`;
    },
    previewCount: 3,
  },

  listMyTrucks: {
    component: TruckListRenderer as ComponentType<InteractiveToolRendererProps<unknown>>,
    getSummary: (result: unknown) => {
      const r = normalizeTruckResult(result);
      return {
        count: r.trucks.length,
        label: "Camions",
        previewItems: r.trucks.slice(0, 3),
      };
    },
    getActions: () => [],
    isSelectable: true,
    formatSelectionMessage: (truck: unknown) => {
      const t = truck as { licensePlate: string };
      return `Je choisis le camion ${t.licensePlate}`;
    },
    previewCount: 3,
  },
};

/**
 * Get the appropriate renderer for a tool.
 * Falls back to generic renderer if no specific one exists.
 */
export function getToolRenderer(
  toolName: string
): ComponentType<ToolRendererProps<unknown>> {
  return TOOL_RENDERERS[toolName] ?? GenericToolRenderer;
}

/**
 * Get metadata for a tool.
 * Returns undefined if no metadata exists.
 */
export function getToolMeta(toolName: string): ToolRendererMeta<unknown> | undefined {
  return TOOL_META[toolName];
}
