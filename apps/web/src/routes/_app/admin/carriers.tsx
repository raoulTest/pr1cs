import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CarrierList, CreateCarrierForm } from "@/features/carriers";

export const Route = createFileRoute("/_app/admin/carriers")({
  component: CarriersPage,
});

function CarriersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <CarrierList onCreateClick={() => setIsCreateDialogOpen(true)} />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Creer une entreprise de transport</DialogTitle>
            <DialogDescription>
              Ajouter une nouvelle entreprise de transport au systeme
            </DialogDescription>
          </DialogHeader>
          <CreateCarrierForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
