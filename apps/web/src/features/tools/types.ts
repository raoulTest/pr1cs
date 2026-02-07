/**
 * Type definitions for the Generative UI Tool System
 */
import type { ReactNode, ComponentType } from "react";

// =============================================================================
// Base Tool Renderer Props
// =============================================================================

/**
 * Base props for tool renderers (backward compatible)
 */
export interface ToolRendererProps<T = unknown> {
  toolName: string;
  args: Record<string, unknown>;
  result: T;
  state: "running" | "result" | "error";
}

/**
 * Enhanced props with interactive handlers
 */
export interface InteractiveToolRendererProps<T = unknown>
  extends ToolRendererProps<T> {
  toolCallId: string;
  error?: string;

  // Interactive handlers
  onAction: ToolActionHandler;
  onSelect: ToolSelectionHandler;

  // Display modes
  previewOnly?: boolean;
  previewCount?: number;
  expanded?: boolean;
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Types of actions available on tool results
 */
export type ToolActionType =
  | "view-details"
  | "cancel-booking"
  | "confirm-booking"
  | "select-slot"
  | "select-terminal"
  | "retry"
  | "expand";

/**
 * An action that can be performed on a tool result
 */
export interface ToolAction {
  type: ToolActionType;
  payload: Record<string, unknown>;
  label: string;
  variant?: "default" | "destructive" | "outline";
  icon?: ReactNode;
}

/**
 * Handler for tool actions
 */
export type ToolActionHandler = (action: ToolAction) => void;

// =============================================================================
// Selections
// =============================================================================

/**
 * Types of selectable items
 */
export type ToolSelectionType =
  | "slot"
  | "terminal"
  | "booking"
  | "container"
  | "truck";

/**
 * A selection made by the user on a tool result
 */
export interface ToolSelection {
  type: ToolSelectionType;
  item: unknown;
  messageToSend: string; // Pre-formatted message to send to AI
}

/**
 * Handler for selections
 */
export type ToolSelectionHandler = (selection: ToolSelection) => void;

// =============================================================================
// Expand Sheet
// =============================================================================

/**
 * Data for the expand sheet modal
 */
export interface ExpandSheetData {
  title: string;
  description?: string;
  toolName: string;
  toolCallId: string;
  result: unknown;
  renderFullContent: () => ReactNode;
}

// =============================================================================
// Confirmation Dialog
// =============================================================================

/**
 * A detail row in the confirmation dialog
 */
export interface ConfirmationDetail {
  label: string;
  value: string;
}

/**
 * Data for the confirmation dialog
 */
export interface ConfirmationData {
  title: string;
  description: string;
  action: ToolAction;
  details: ConfirmationDetail[];
  onConfirm: () => void;
  onCancel: () => void;
}

// =============================================================================
// Input Forms
// =============================================================================

/**
 * Field types for input forms
 */
export type FormFieldType =
  | "date"
  | "time"
  | "datetime"
  | "select"
  | "text"
  | "number"
  | "multiselect";

/**
 * Option for select fields
 */
export interface FormFieldOption {
  label: string;
  value: string;
}

/**
 * A field in an input form
 */
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: FormFieldOption[];
  defaultValue?: unknown;
  placeholder?: string;
}

/**
 * Input form data
 */
export interface ChatInputForm {
  type: "booking-form" | "date-picker" | "terminal-selector" | "custom";
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit: (data: Record<string, unknown>) => void;
}

// =============================================================================
// Tool Renderer Metadata
// =============================================================================

/**
 * Summary configuration for a tool
 */
export interface ToolSummary {
  count: number;
  label: string;
  previewItems: unknown[];
}

/**
 * Metadata for tool renderers
 */
export interface ToolRendererMeta<T = unknown> {
  component: ComponentType<InteractiveToolRendererProps<T>>;

  /**
   * Get summary data for preview mode
   */
  getSummary?: (result: T) => ToolSummary;

  /**
   * Get available actions for this tool's result
   */
  getActions?: (
    result: T,
    args: Record<string, unknown>
  ) => ToolAction[];

  /**
   * Whether items in the result are selectable
   */
  isSelectable?: boolean;

  /**
   * Format a selection into a message to send to AI
   */
  formatSelectionMessage?: (item: unknown) => string;

  /**
   * Maximum items to show in preview mode
   */
  previewCount?: number;
}

// =============================================================================
// Context Types
// =============================================================================

/**
 * Tool UI Context value
 */
export interface ToolUIContextValue {
  // Expand sheet management
  expandSheet: ExpandSheetData | null;
  openExpandSheet: (data: ExpandSheetData) => void;
  closeExpandSheet: () => void;

  // Confirmation dialog
  confirmation: ConfirmationData | null;
  showConfirmation: (data: ConfirmationData) => void;
  closeConfirmation: () => void;

  // AI message sending
  sendMessage: (message: string) => void;

  // Action/selection handlers
  handleSelection: (selection: ToolSelection) => void;
  handleAction: (action: ToolAction) => void;
}
