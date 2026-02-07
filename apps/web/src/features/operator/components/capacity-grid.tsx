"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

interface CapacityGridProps {
  terminalId: Id<"terminals"> | null;
}

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface SlotTemplate {
  _id: Id<"slotTemplates">;
  dayOfWeek: number;
  hour: number;
  maxCapacity: number;
  isActive: boolean;
}

// Represents a local edit (partial update)
interface LocalEdit {
  maxCapacity?: number;
  isActive?: boolean;
}

export function CapacityGrid({ terminalId }: CapacityGridProps) {
  const templates = useQuery(
    api.slotTemplates.queries.listByTerminal,
    terminalId ? { terminalId } : "skip"
  );
  const bulkUpdate = useMutation(api.slotTemplates.mutations.bulkUpdate);

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkCapacity, setBulkCapacity] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Local edits: Map of slot key (day-hour) to pending changes
  const [localEdits, setLocalEdits] = useState<Map<string, LocalEdit>>(new Map());

  // Create a lookup map for quick access to server data
  const templateMap = useMemo(() => {
    const map = new Map<string, SlotTemplate>();
    templates?.forEach((t) => {
      map.set(`${t.dayOfWeek}-${t.hour}`, t);
    });
    return map;
  }, [templates]);

  // Reset local edits when terminal changes
  useEffect(() => {
    setLocalEdits(new Map());
    setSelectedSlots(new Set());
  }, [terminalId]);

  // Get the effective value for a slot (local edit overrides server data)
  const getEffectiveTemplate = useCallback((key: string): SlotTemplate | undefined => {
    const serverTemplate = templateMap.get(key);
    if (!serverTemplate) return undefined;
    
    const localEdit = localEdits.get(key);
    if (!localEdit) return serverTemplate;
    
    return {
      ...serverTemplate,
      ...(localEdit.maxCapacity !== undefined && { maxCapacity: localEdit.maxCapacity }),
      ...(localEdit.isActive !== undefined && { isActive: localEdit.isActive }),
    };
  }, [templateMap, localEdits]);

  // Check if a slot has pending changes
  const hasLocalEdit = useCallback((key: string): boolean => {
    return localEdits.has(key);
  }, [localEdits]);

  // Count of pending changes
  const pendingChangesCount = localEdits.size;

  // Apply a local edit to a slot
  const applyLocalEdit = useCallback((key: string, edit: LocalEdit) => {
    setLocalEdits((prev) => {
      const newEdits = new Map(prev);
      const existingEdit = newEdits.get(key) || {};
      const mergedEdit = { ...existingEdit, ...edit };
      
      // Check if the edit matches the server state - if so, remove it
      const serverTemplate = templateMap.get(key);
      if (serverTemplate) {
        const capacityMatches = mergedEdit.maxCapacity === undefined || 
          mergedEdit.maxCapacity === serverTemplate.maxCapacity;
        const activeMatches = mergedEdit.isActive === undefined || 
          mergedEdit.isActive === serverTemplate.isActive;
        
        if (capacityMatches && activeMatches) {
          newEdits.delete(key);
          return newEdits;
        }
      }
      
      newEdits.set(key, mergedEdit);
      return newEdits;
    });
  }, [templateMap]);

  // Discard all local changes
  const discardChanges = useCallback(() => {
    setLocalEdits(new Map());
    setSelectedSlots(new Set());
    toast.info("Modifications annulées");
  }, []);

  // Save all pending changes to the server
  const saveChanges = useCallback(async () => {
    if (localEdits.size === 0) return;
    
    setIsProcessing(true);
    try {
      // Group edits by the update payload to minimize mutations
      // We'll batch all updates into one call
      const updates: Array<{
        templateId: Id<"slotTemplates">;
        maxCapacity?: number;
        isActive?: boolean;
      }> = [];

      localEdits.forEach((edit, key) => {
        const template = templateMap.get(key);
        if (template) {
          updates.push({
            templateId: template._id,
            ...(edit.maxCapacity !== undefined && { maxCapacity: edit.maxCapacity }),
            ...(edit.isActive !== undefined && { isActive: edit.isActive }),
          });
        }
      });

      // Process updates - we can use bulkUpdate for same-value updates
      // For mixed updates, we need individual calls or group them
      // Let's group by capacity+active combinations for efficiency
      const capacityGroups = new Map<string, Id<"slotTemplates">[]>();
      
      updates.forEach(({ templateId, maxCapacity, isActive }) => {
        const groupKey = `${maxCapacity ?? "none"}-${isActive ?? "none"}`;
        if (!capacityGroups.has(groupKey)) {
          capacityGroups.set(groupKey, []);
        }
        capacityGroups.get(groupKey)!.push(templateId);
      });

      // Execute bulk updates for each group
      const promises: Promise<{ updated: number; failed: number }>[] = [];
      capacityGroups.forEach((templateIds, groupKey) => {
        const [capacityStr, activeStr] = groupKey.split("-");
        const updatePayload: {
          templateIds: Id<"slotTemplates">[];
          maxCapacity?: number;
          isActive?: boolean;
        } = { templateIds };
        
        if (capacityStr !== "none") {
          updatePayload.maxCapacity = parseInt(capacityStr);
        }
        if (activeStr !== "none") {
          updatePayload.isActive = activeStr === "true";
        }
        
        promises.push(bulkUpdate(updatePayload));
      });

      await Promise.all(promises);
      
      setLocalEdits(new Map());
      setSelectedSlots(new Set());
      toast.success(`${updates.length} créneau(x) mis à jour`);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsProcessing(false);
    }
  }, [localEdits, templateMap, bulkUpdate]);

  if (!terminalId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Sélectionnez un terminal pour gérer la capacité
      </div>
    );
  }

  if (templates === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const getSlotKey = (day: number, hour: number) => `${day}-${hour}`;

  const handleSlotClick = (day: number, hour: number) => {
    const key = getSlotKey(day, hour);
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedSlots(newSelected);
  };

  // Toggle active status locally (client-side)
  const handleToggleActive = (key: string, currentActive: boolean) => {
    applyLocalEdit(key, { isActive: !currentActive });
  };

  // Bulk toggle active status locally
  const handleBulkToggle = (activate: boolean) => {
    if (selectedSlots.size === 0) return;
    
    selectedSlots.forEach((key) => {
      applyLocalEdit(key, { isActive: activate });
    });
    
    setSelectedSlots(new Set());
    toast.info(`${selectedSlots.size} créneaux ${activate ? "activés" : "désactivés"} (non sauvegardé)`);
  };

  // Bulk set capacity locally
  const handleBulkCapacity = () => {
    if (selectedSlots.size === 0) return;
    
    const count = selectedSlots.size;
    selectedSlots.forEach((key) => {
      applyLocalEdit(key, { maxCapacity: bulkCapacity });
    });
    
    setSelectedSlots(new Set());
    setEditDialogOpen(false);
    toast.info(`Capacité modifiée pour ${count} créneaux (non sauvegardé)`);
  };

  const selectAll = () => {
    const all = new Set<string>();
    DAYS_FR.forEach((_, day) => {
      HOURS.forEach((hour) => {
        all.add(getSlotKey(day, hour));
      });
    });
    setSelectedSlots(all);
  };

  const clearSelection = () => setSelectedSlots(new Set());

  // Select/deselect an entire row (all hours for a day)
  const handleSelectRow = (dayIndex: number) => {
    const rowKeys = HOURS.map((hour) => getSlotKey(dayIndex, hour));
    const allSelected = rowKeys.every((key) => selectedSlots.has(key));
    
    const newSelected = new Set(selectedSlots);
    if (allSelected) {
      // Deselect all in this row
      rowKeys.forEach((key) => newSelected.delete(key));
    } else {
      // Select all in this row
      rowKeys.forEach((key) => newSelected.add(key));
    }
    setSelectedSlots(newSelected);
  };

  // Select/deselect an entire column (all days for an hour)
  const handleSelectColumn = (hour: number) => {
    const colKeys = DAYS_FR.map((_, dayIndex) => getSlotKey(dayIndex, hour));
    const allSelected = colKeys.every((key) => selectedSlots.has(key));
    
    const newSelected = new Set(selectedSlots);
    if (allSelected) {
      // Deselect all in this column
      colKeys.forEach((key) => newSelected.delete(key));
    } else {
      // Select all in this column
      colKeys.forEach((key) => newSelected.add(key));
    }
    setSelectedSlots(newSelected);
  };

  // Check if entire row is selected
  const isRowSelected = (dayIndex: number) => {
    return HOURS.every((hour) => selectedSlots.has(getSlotKey(dayIndex, hour)));
  };

  // Check if entire column is selected
  const isColumnSelected = (hour: number) => {
    return DAYS_FR.every((_, dayIndex) => selectedSlots.has(getSlotKey(dayIndex, hour)));
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Grille de capacité hebdomadaire
                {pendingChangesCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {pendingChangesCount} modification{pendingChangesCount > 1 ? "s" : ""} non sauvegardée{pendingChangesCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                168 créneaux (7 jours × 24 heures). Cliquez pour sélectionner, puis modifier en lot.
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Save/Discard buttons - always visible when there are pending changes */}
              {pendingChangesCount > 0 && (
                <>
                  <Button
                    size="sm"
                    onClick={saveChanges}
                    disabled={isProcessing}
                    className="gap-1.5"
                  >
                    <Save className="size-4" />
                    {isProcessing ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={discardChanges}
                    disabled={isProcessing}
                    className="gap-1.5"
                  >
                    <RotateCcw className="size-4" />
                    Annuler
                  </Button>
                </>
              )}
              {selectedSlots.size > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkToggle(true)}
                    disabled={isProcessing}
                  >
                    Activer ({selectedSlots.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkToggle(false)}
                    disabled={isProcessing}
                  >
                    Désactiver ({selectedSlots.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditDialogOpen(true)}
                    disabled={isProcessing}
                  >
                    Modifier capacité
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearSelection}>
                    Effacer
                  </Button>
                </>
              )}
              {selectedSlots.size === 0 && pendingChangesCount === 0 && (
                <Button size="sm" variant="outline" onClick={selectAll}>
                  Tout sélectionner
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex items-center gap-6 mb-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-blue-500" />
              <span>Actif</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-red-400" />
              <span>Inactif</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border-2 border-primary" />
              <span>Sélectionné</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-amber-500" />
              <span>Modifié (non sauvegardé)</span>
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row - hours (clickable to select column) */}
              <div className="flex">
                <div className="w-16 shrink-0" /> {/* Empty corner */}
                {HOURS.map((hour) => (
                  <Tooltip key={hour}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleSelectColumn(hour)}
                        className={cn(
                          "flex-1 min-w-8 text-center text-xs font-medium py-1 rounded-t transition-colors",
                          "hover:bg-muted cursor-pointer",
                          "focus:outline-none focus:ring-1 focus:ring-ring",
                          isColumnSelected(hour)
                            ? "bg-primary/20 text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {hour.toString().padStart(2, "0")}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cliquez pour sélectionner {hour}h00</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Day rows */}
              {DAYS_FR.map((dayName, dayIndex) => (
                <div key={dayIndex} className="flex">
                  {/* Day label (clickable to select row) */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleSelectRow(dayIndex)}
                        className={cn(
                          "w-16 shrink-0 flex items-center text-sm font-medium pr-2 rounded-l transition-colors",
                          "hover:bg-muted cursor-pointer",
                          "focus:outline-none focus:ring-1 focus:ring-ring",
                          isRowSelected(dayIndex)
                            ? "bg-primary/20 text-primary"
                            : ""
                        )}
                      >
                        {dayName}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cliquez pour sélectionner {DAYS_FULL_FR[dayIndex]}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Hour cells */}
                  {HOURS.map((hour) => {
                    const key = getSlotKey(dayIndex, hour);
                    const effectiveTemplate = getEffectiveTemplate(key);
                    const isActive = effectiveTemplate?.isActive ?? false;
                    const capacity = effectiveTemplate?.maxCapacity ?? 0;
                    const isSelected = selectedSlots.has(key);
                    const isModified = hasLocalEdit(key);

                    return (
                      <Tooltip key={hour}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "flex-1 min-w-8 h-8 m-0.5 rounded text-xs font-medium transition-all",
                              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                              isModified
                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                : isActive
                                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                                  : "bg-red-400 hover:bg-red-500 text-white",
                              isSelected && "ring-2 ring-primary ring-offset-1"
                            )}
                            onClick={() => handleSlotClick(dayIndex, hour)}
                            onDoubleClick={() => {
                              handleToggleActive(key, isActive);
                            }}
                          >
                            {capacity}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">
                            {DAYS_FULL_FR[dayIndex]} {hour}h00 - {hour + 1}h00
                          </p>
                          <p>Capacité: {capacity} camions</p>
                          <p>Status: {isActive ? "Actif" : "Inactif"}</p>
                          {isModified && (
                            <p className="text-amber-400 text-xs mt-1">
                              Modifié (non sauvegardé)
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Double-clic pour activer/désactiver
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Capacity Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la capacité</DialogTitle>
            <DialogDescription>
              Définir la capacité pour {selectedSlots.size} créneau(x) sélectionné(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacité (nombre de camions)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={bulkCapacity}
                onChange={(e) => setBulkCapacity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkCapacity}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
