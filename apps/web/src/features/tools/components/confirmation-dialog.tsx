"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToolUI } from "../context/tool-ui-context";

export function ConfirmationDialog() {
  const { confirmation, closeConfirmation } = useToolUI();

  if (!confirmation) return null;

  return (
    <AlertDialog
      open={!!confirmation}
      onOpenChange={(open) => !open && closeConfirmation()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmation.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmation.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Details */}
        {confirmation.details.length > 0 && (
          <div className="space-y-2 py-4 border-y border-border/50">
            {confirmation.details.map((detail) => (
              <div key={detail.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{detail.label}</span>
                <span className="font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={confirmation.onCancel}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmation.onConfirm}>
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
