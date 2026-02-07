import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TerminalList, CreateTerminalForm } from "@/features/terminals";

export const Route = createFileRoute("/_app/admin/terminals")({
  component: TerminalsPage,
});

function TerminalsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <TerminalList onCreateClick={() => setIsCreateDialogOpen(true)} />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Creer un terminal</DialogTitle>
            <DialogDescription>
              Ajouter un nouveau terminal au systeme portuaire
            </DialogDescription>
          </DialogHeader>
          <CreateTerminalForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
