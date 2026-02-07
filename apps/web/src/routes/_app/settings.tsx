import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { SettingsIcon, UserIcon, BellIcon, GlobeIcon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

// Note: Anchor is French-only as per project requirements
const LANGUAGES = [
  { value: "fr", label: "Français" },
] as const;

const NOTIFICATION_CHANNELS = [
  { value: "in_app", label: "Notifications in-app uniquement" },
  { value: "email", label: "Email uniquement" },
  { value: "both", label: "Email et in-app" },
];

function SettingsPage() {
  const profile = useQuery(api.users.queries.getMyProfile);
  const updateProfile = useMutation(api.users.mutations.updateMyProfile);

  const form = useForm({
    defaultValues: {
      phone: profile?.phone ?? "",
      preferredLanguage: "fr" as const,
      notificationChannel: (profile?.notificationChannel ?? "in_app") as "in_app" | "email" | "both",
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProfile({
          phone: value.phone || undefined,
          preferredLanguage: value.preferredLanguage,
          notificationChannel: value.notificationChannel,
        });
        toast.success("Préférences mises à jour avec succès");
      } catch (error) {
        toast.error("Erreur lors de la mise à jour des préférences");
      }
    },
  });

  if (profile === undefined) {
    return (
      <div className="container mx-auto py-6 max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Profil non trouvé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "port_admin":
        return <Badge className="bg-red-500 text-white">Administrateur port</Badge>;
      case "terminal_operator":
        return <Badge className="bg-blue-500 text-white">Opérateur terminal</Badge>;
      case "carrier":
        return <Badge className="bg-green-500 text-white">Transporteur</Badge>;
      default:
        return <Badge variant="secondary">Utilisateur</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="size-6" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez vos préférences et informations de compte
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5" />
            Informations du compte
          </CardTitle>
          <CardDescription>
            Vos informations de compte (non modifiables)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{profile.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom</label>
              <p className="text-sm">{profile.name ?? "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rôle</label>
              <div className="mt-1">{getRoleBadge(profile.apcsRole)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GlobeIcon className="size-5" />
              Préférences
            </CardTitle>
            <CardDescription>
              Personnalisez votre expérience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form.Field name="phone">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Téléphone</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="tel"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                    />
                    <FieldDescription>
                      Numéro de téléphone pour les notifications SMS (optionnel)
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="preferredLanguage">
              {(field) => (
                <Field>
                  <FieldLabel>Langue préférée</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as "fr")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Anchor est disponible uniquement en français
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="notificationChannel">
              {(field) => (
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <BellIcon className="size-4" />
                    Canal de notification
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as "in_app" | "email" | "both")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_CHANNELS.map((channel) => (
                          <SelectItem key={channel.value} value={channel.value}>
                            {channel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Choisissez comment recevoir vos notifications
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <div className="flex justify-end pt-4">
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? <Spinner className="mr-2 size-4" /> : <SaveIcon className="mr-2 size-4" />}
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
