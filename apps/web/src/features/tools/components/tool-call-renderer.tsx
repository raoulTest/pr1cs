"use client";

import type { ComponentType } from "react";
import type { InteractiveToolRendererProps, ToolRendererProps } from "../types";
import { useToolUIOptional } from "../context/tool-ui-context";
import { ToolLoadingState } from "./tool-loading-state";
import { ToolErrorState } from "./tool-error-state";
import { getToolRenderer, getToolMeta } from "../registry";

interface ToolCallRendererProps extends Omit<ToolRendererProps, "result"> {
  toolCallId?: string;
  result?: unknown;
  error?: string;
}

/**
 * Orchestrator component that renders the appropriate tool UI
 *
 * Handles:
 * - Loading states with skeleton
 * - Error states with retry
 * - Routing to specific renderers
 * - Summary/expand behavior
 */
export function ToolCallRenderer(props: ToolCallRendererProps) {
  const { toolName, state, result: rawResult, error, args } = props;
  const toolUI = useToolUIOptional();

  // Unwrap _display wrapper if present (safety net — chat-message-item
  // should already have unwrapped, but handle it here too for robustness)
  const result =
    rawResult &&
    typeof rawResult === "object" &&
    "_display" in rawResult &&
    "data" in rawResult
      ? (rawResult as { _display: boolean; data: unknown }).data
      : rawResult;

  // Get the appropriate renderer and metadata
  const Renderer = getToolRenderer(toolName) as ComponentType<InteractiveToolRendererProps>;
  const meta = getToolMeta(toolName);

  // Default handlers if not in a ToolUIProvider context
  const handleAction = toolUI?.handleAction ?? (() => {});
  const handleSelection = toolUI?.handleSelection ?? (() => {});
  const openExpandSheet = toolUI?.openExpandSheet;

  // Loading state
  if (state === "running") {
    return <ToolLoadingState toolName={toolName} />;
  }

  // Error state
  if (state === "error" || error) {
    return (
      <ToolErrorState
        toolName={toolName}
        error={error || "Une erreur est survenue"}
        onRetry={
          toolUI
            ? () =>
                handleAction({
                  type: "retry",
                  payload: { ...args, originalRequest: args },
                  label: "Reessayer",
                })
            : undefined
        }
      />
    );
  }

  // No result yet
  if (!result) {
    return <ToolLoadingState toolName={toolName} />;
  }

  // Build interactive props
  const interactiveProps: InteractiveToolRendererProps = {
    toolName,
    toolCallId: props.toolCallId || `${toolName}-${Date.now()}`,
    args,
    result,
    state,
    error,
    onAction: handleAction,
    onSelect: handleSelection,
  };

  // Check if we should use summary mode
  if (meta?.getSummary && openExpandSheet) {
    const summary = meta.getSummary(result);
    const previewCount = meta.previewCount ?? 3;

    // If more items than preview count, show preview with expand
    if (summary.count > previewCount) {
      return (
        <Renderer
          {...interactiveProps}
          previewOnly
          previewCount={previewCount}
        />
      );
    }
  }

  // Full render
  return <Renderer {...interactiveProps} />;
}
