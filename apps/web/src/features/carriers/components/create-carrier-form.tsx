/**
 * NOTE: This component is deprecated.
 * 
 * In the updated schema, carriers are just users with role="carrier".
 * Carrier creation is handled through the authentication/signup flow,
 * not through a separate carrier company creation form.
 * 
 * The admin can assign the "carrier" role to users through Better Auth.
 */

import { Button } from "@/components/ui/button";

interface CreateCarrierFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateCarrierForm({ onCancel }: CreateCarrierFormProps) {
  return (
    <div className="space-y-4 p-4 text-center">
      <p className="text-muted-foreground">
        La creation de transporteurs se fait maintenant via l'inscription utilisateur.
        Les administrateurs peuvent assigner le role "carrier" aux utilisateurs existants.
      </p>
      {onCancel && (
        <Button variant="outline" onClick={onCancel}>
          Fermer
        </Button>
      )}
    </div>
  );
}
