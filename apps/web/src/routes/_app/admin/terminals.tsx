import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TerminalList, CreateTerminalForm, EditTerminalForm } from "@/features/terminals";

export const Route = createFileRoute("/_app/admin/terminals")({
  component: TerminalsPage,
});

function TerminalsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editTerminalId, setEditTerminalId] = useState<Id<"terminals"> | null>(null);

  return (
    <div className="space-y-6">
      <TerminalList
        onCreateClick={() => setIsCreateDialogOpen(true)}
        onEditClick={(terminalId) => setEditTerminalId(terminalId)}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un terminal</DialogTitle>
            <DialogDescription>
              Ajouter un nouveau terminal au système portuaire
            </DialogDescription>
          </DialogHeader>
          <CreateTerminalForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editTerminalId !== null}
        onOpenChange={(open) => !open && setEditTerminalId(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le terminal</DialogTitle>
            <DialogDescription>
              Modifier les informations du terminal
            </DialogDescription>
          </DialogHeader>
          {editTerminalId && (
            <EditTerminalForm
              terminalId={editTerminalId}
              onSuccess={() => setEditTerminalId(null)}
              onCancel={() => setEditTerminalId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
