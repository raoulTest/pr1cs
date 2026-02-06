import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CarrierList, CreateCarrierForm } from "@/features/carriers";

export const Route = createFileRoute("/admin/carriers")({
  component: CarriersPage,
});

function CarriersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <Authenticated>
        <div className="container mx-auto py-6">
          <CarrierList onCreateClick={() => setIsCreateDialogOpen(true)} />

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Carrier Company</DialogTitle>
                <DialogDescription>
                  Add a new carrier company to the system
                </DialogDescription>
              </DialogHeader>
              <CreateCarrierForm
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
