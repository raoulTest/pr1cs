import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TerminalList, CreateTerminalForm } from "@/features/terminals";

export const Route = createFileRoute("/admin/terminals")({
  component: TerminalsPage,
});

function TerminalsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <Authenticated>
        <div className="container mx-auto py-6">
          <TerminalList onCreateClick={() => setIsCreateDialogOpen(true)} />

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Terminal</DialogTitle>
                <DialogDescription>
                  Add a new terminal to the port system
                </DialogDescription>
              </DialogHeader>
              <CreateTerminalForm
                onSuccess={() => setIsCreateDialogOpen(false)}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Please sign in to access this page</p>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AuthLoading>
    </>
  );
}
