"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useState, useMemo } from "react";
import { toast } from "sonner";
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

export function CapacityGrid({ terminalId }: CapacityGridProps) {
  const templates = useQuery(
    api.slotTemplates.listByTerminal,
    terminalId ? { terminalId } : "skip"
  );
  const updateTemplate = useMutation(api.slotTemplates.update);
  const bulkUpdate = useMutation(api.slotTemplates.bulkUpdate);

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkCapacity, setBulkCapacity] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create a lookup map for quick access
  const templateMap = useMemo(() => {
    const map = new Map<string, SlotTemplate>();
    templates?.forEach((t) => {
      map.set(`${t.dayOfWeek}-${t.hour}`, t);
    });
    return map;
  }, [templates]);

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

  const handleToggleActive = async (templateId: Id<"slotTemplates">, currentActive: boolean) => {
    try {
      await updateTemplate({ templateId, isActive: !currentActive });
      toast.success(currentActive ? "Créneau désactivé" : "Créneau activé");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleBulkToggle = async (activate: boolean) => {
    if (selectedSlots.size === 0) return;
    setIsProcessing(true);
    try {
      const templateIds: Id<"slotTemplates">[] = [];
      selectedSlots.forEach((key) => {
        const template = templateMap.get(key);
        if (template) templateIds.push(template._id);
      });

      await bulkUpdate({ templateIds, isActive: activate });
      toast.success(`${templateIds.length} créneaux ${activate ? "activés" : "désactivés"}`);
      setSelectedSlots(new Set());
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCapacity = async () => {
    if (selectedSlots.size === 0) return;
    setIsProcessing(true);
    try {
      const templateIds: Id<"slotTemplates">[] = [];
      selectedSlots.forEach((key) => {
        const template = templateMap.get(key);
        if (template) templateIds.push(template._id);
      });

      await bulkUpdate({ templateIds, maxCapacity: bulkCapacity });
      toast.success(`Capacité mise à jour pour ${templateIds.length} créneaux`);
      setSelectedSlots(new Set());
      setEditDialogOpen(false);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Grille de capacité hebdomadaire</CardTitle>
              <CardDescription>
                168 créneaux (7 jours × 24 heures). Cliquez pour sélectionner, puis modifier en lot.
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
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
              {selectedSlots.size === 0 && (
                <Button size="sm" variant="outline" onClick={selectAll}>
                  Tout sélectionner
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex items-center gap-6 mb-4 text-sm">
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
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row - hours */}
              <div className="flex">
                <div className="w-16 shrink-0" /> {/* Empty corner */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="flex-1 min-w-8 text-center text-xs text-muted-foreground font-medium py-1"
                  >
                    {hour.toString().padStart(2, "0")}
                  </div>
                ))}
              </div>

              {/* Day rows */}
              {DAYS_FR.map((dayName, dayIndex) => (
                <div key={dayIndex} className="flex">
                  {/* Day label */}
                  <div className="w-16 shrink-0 flex items-center text-sm font-medium pr-2">
                    {dayName}
                  </div>

                  {/* Hour cells */}
                  {HOURS.map((hour) => {
                    const key = getSlotKey(dayIndex, hour);
                    const template = templateMap.get(key);
                    const isActive = template?.isActive ?? false;
                    const capacity = template?.maxCapacity ?? 0;
                    const isSelected = selectedSlots.has(key);

                    return (
                      <Tooltip key={hour}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "flex-1 min-w-8 h-8 m-0.5 rounded text-xs font-medium transition-all",
                              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                              isActive
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : "bg-red-400 hover:bg-red-500 text-white",
                              isSelected && "ring-2 ring-primary ring-offset-1"
                            )}
                            onClick={() => handleSlotClick(dayIndex, hour)}
                            onDoubleClick={() => {
                              if (template) {
                                handleToggleActive(template._id, template.isActive);
                              }
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
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleBulkCapacity} disabled={isProcessing}>
              {isProcessing ? "Mise à jour..." : "Appliquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
