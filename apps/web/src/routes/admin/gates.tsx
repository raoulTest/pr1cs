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
import { GateList, CreateGateForm } from "@/features/gates";

export const Route = createFileRoute("/admin/gates")({
  component: GatesPage,
});

function GatesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <Authenticated>
        <div className="container mx-auto py-6">
          <GateList onCreateClick={() => setIsCreateDialogOpen(true)} />

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Gate</DialogTitle>
                <DialogDescription>
                  Add a new gate to a terminal
                </DialogDescription>
              </DialogHeader>
              <CreateGateForm
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
