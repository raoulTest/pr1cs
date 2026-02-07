/**
 * Tool Feature Module
 *
 * This file re-exports from registry.ts for backward compatibility.
 * New code should import from './registry' directly.
 */

// Re-export everything from registry
export * from "./registry";
export * from "./types";

// Re-export context
export { ToolUIProvider, useToolUI, useToolUIOptional } from "./context/tool-ui-context";

// Re-export components
export { ToolCallRenderer } from "./components/tool-call-renderer";
export { ToolLoadingState } from "./components/tool-loading-state";
export { ToolErrorState } from "./components/tool-error-state";
export { ToolExpandSheet } from "./components/tool-expand-sheet";
export { ConfirmationDialog } from "./components/confirmation-dialog";
export { ToolSummaryWrapper } from "./components/tool-summary-wrapper";
