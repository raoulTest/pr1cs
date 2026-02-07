"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToolUI } from "../context/tool-ui-context";

export function ToolExpandSheet() {
  const { expandSheet, closeExpandSheet } = useToolUI();

  if (!expandSheet) return null;

  return (
    <Sheet
      open={!!expandSheet}
      onOpenChange={(open) => !open && closeExpandSheet()}
    >
      <SheetContent
        side="right"
        className="w-[80vw] max-w-[80vw] sm:max-w-[80vw] p-0"
      >
        <SheetHeader className="p-4 border-b border-border/50">
          <SheetTitle>{expandSheet.title}</SheetTitle>
          {expandSheet.description && (
            <SheetDescription>{expandSheet.description}</SheetDescription>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4">{expandSheet.renderFullContent()}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
