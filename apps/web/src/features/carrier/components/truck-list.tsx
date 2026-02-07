"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TruckIcon, PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

type TruckType = "standard" | "refrigerated" | "hazmat" | "oversized" | "flatbed";
type TruckClass = "light" | "medium" | "heavy" | "super_heavy";

const TRUCK_TYPE_LABELS: Record<TruckType, string> = {
  standard: "Standard",
  refrigerated: "Frigorifique",
  hazmat: "Matieres dangereuses",
  oversized: "Hors gabarit",
  flatbed: "Plateau",
};

const TRUCK_CLASS_LABELS: Record<TruckClass, string> = {
  light: "Leger",
  medium: "Moyen",
  heavy: "Lourd",
  super_heavy: "Super lourd",
};

interface Truck {
  _id: Id<"trucks">;
  _creationTime: number;
  licensePlate: string;
  truckType: TruckType;
  truckClass: TruckClass;
  make?: string;
  model?: string;
  year?: number;
  maxWeight?: number;
  isActive: boolean;
}

export function TruckList() {
  const trucks = useQuery(api.trucks.listMyTrucks, {});
  const createTruck = useMutation(api.trucks.create);
  const updateTruck = useMutation(api.trucks.update);
  const deleteTruck = useMutation(api.trucks.remove);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTruck, setEditTruck] = useState<Truck | null>(null);
  const [deleteTruckId, setDeleteTruckId] = useState<Id<"trucks"> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [licensePlate, setLicensePlate] = useState("");
  const [truckType, setTruckType] = useState<TruckType>("standard");
  const [truckClass, setTruckClass] = useState<TruckClass>("medium");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const resetForm = () => {
    setLicensePlate("");
    setTruckType("standard");
    setTruckClass("medium");
    setMake("");
    setModel("");
  };

  const openEditDialog = (truck: Truck) => {
    setEditTruck(truck);
    setLicensePlate(truck.licensePlate);
    setTruckType(truck.truckType);
    setTruckClass(truck.truckClass);
    setMake(truck.make || "");
    setModel(truck.model || "");
  };

  const handleCreate = async () => {
    if (!licensePlate.trim()) {
      toast.error("La plaque d'immatriculation est requise");
      return;
    }
    setIsProcessing(true);
    try {
      await createTruck({
        licensePlate: licensePlate.toUpperCase().trim(),
        truckType,
        truckClass,
        make: make || undefined,
        model: model || undefined,
      });
      toast.success("Camion ajoute avec succes");
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Erreur lors de la creation du camion");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTruck) return;
    setIsProcessing(true);
    try {
      await updateTruck({
        truckId: editTruck._id,
        licensePlate: licensePlate.toUpperCase().trim(),
        truckType,
        truckClass,
        make: make || undefined,
        model: model || undefined,
      });
      toast.success("Camion mis a jour");
      setEditTruck(null);
      resetForm();
    } catch (error) {
      toast.error("Erreur lors de la mise a jour");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTruckId) return;
    setIsProcessing(true);
    try {
      await deleteTruck({ truckId: deleteTruckId });
      toast.success("Camion supprime");
      setDeleteTruckId(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsProcessing(false);
    }
  };

  if (trucks === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          {trucks.length} camion(s) enregistre(s)
        </p>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          Ajouter un camion
        </Button>
      </div>

      {trucks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <TruckIcon className="mx-auto mb-4 size-12 opacity-50" />
            <p className="text-lg font-medium">Aucun camion enregistre</p>
            <p className="text-sm">Ajoutez votre premier camion pour commencer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trucks.map((truck) => (
            <Card key={truck._id} className={cn(!truck.isActive && "opacity-60")}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-mono">
                    {truck.licensePlate}
                  </CardTitle>
                  <Badge variant={truck.isActive ? "default" : "secondary"}>
                    {truck.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{TRUCK_TYPE_LABELS[truck.truckType]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classe:</span>
                    <span>{TRUCK_CLASS_LABELS[truck.truckClass]}</span>
                  </div>
                  {(truck.make || truck.model) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicule:</span>
                      <span>{[truck.make, truck.model].filter(Boolean).join(" ")}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(truck as Truck)}
                  >
                    <EditIcon className="mr-1 size-3" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTruckId(truck._id)}
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un camion</DialogTitle>
            <DialogDescription>
              Enregistrez un nouveau camion pour vos reservations
            </DialogDescription>
          </DialogHeader>
          <TruckForm
            licensePlate={licensePlate}
            setLicensePlate={setLicensePlate}
            truckType={truckType}
            setTruckType={setTruckType}
            truckClass={truckClass}
            setTruckClass={setTruckClass}
            make={make}
            setMake={setMake}
            model={model}
            setModel={setModel}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={isProcessing}>
              {isProcessing ? "Creation..." : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTruck} onOpenChange={() => setEditTruck(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le camion</DialogTitle>
          </DialogHeader>
          <TruckForm
            licensePlate={licensePlate}
            setLicensePlate={setLicensePlate}
            truckType={truckType}
            setTruckType={setTruckType}
            truckClass={truckClass}
            setTruckClass={setTruckClass}
            make={make}
            setMake={setMake}
            model={model}
            setModel={setModel}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTruck(null)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={isProcessing}>
              {isProcessing ? "Mise a jour..." : "Mettre a jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTruckId} onOpenChange={() => setDeleteTruckId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le camion?</DialogTitle>
            <DialogDescription>
              Cette action est irreversible. Le camion sera definitivement supprime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTruckId(null)} disabled={isProcessing}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface TruckFormProps {
  licensePlate: string;
  setLicensePlate: (value: string) => void;
  truckType: TruckType;
  setTruckType: (value: TruckType) => void;
  truckClass: TruckClass;
  setTruckClass: (value: TruckClass) => void;
  make: string;
  setMake: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
}

function TruckForm({
  licensePlate,
  setLicensePlate,
  truckType,
  setTruckType,
  truckClass,
  setTruckClass,
  make,
  setMake,
  model,
  setModel,
}: TruckFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="licensePlate">Plaque d'immatriculation *</Label>
        <Input
          id="licensePlate"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
          placeholder="AB-123-CD"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type de camion</Label>
          <Select value={truckType} onValueChange={(v) => setTruckType(v as TruckType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRUCK_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Classe</Label>
          <Select value={truckClass} onValueChange={(v) => setTruckClass(v as TruckClass)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRUCK_CLASS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="make">Marque</Label>
          <Input
            id="make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Volvo, MAN, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Modele</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="FH16, TGX, etc."
          />
        </div>
      </div>
    </div>
  );
}
