import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GateList, CreateGateForm } from "@/features/gates";

export const Route = createFileRoute("/_app/admin/gates")({
  component: GatesPage,
});

function GatesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <GateList onCreateClick={() => setIsCreateDialogOpen(true)} />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Creer une porte</DialogTitle>
            <DialogDescription>
              Ajouter une nouvelle porte a un terminal
            </DialogDescription>
          </DialogHeader>
          <CreateGateForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
