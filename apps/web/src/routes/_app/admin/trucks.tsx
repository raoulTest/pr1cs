import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TruckList, CreateTruckForm } from "@/features/trucks";

export const Route = createFileRoute("/_app/admin/trucks")({
  component: TrucksPage,
});

function TrucksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <TruckList onCreateClick={() => setIsCreateDialogOpen(true)} />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enregistrer un camion</DialogTitle>
            <DialogDescription>
              Ajouter un nouveau camion a la flotte d'un transporteur
            </DialogDescription>
          </DialogHeader>
          <CreateTruckForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
