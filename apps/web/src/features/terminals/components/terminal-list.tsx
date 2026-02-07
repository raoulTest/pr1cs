import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import {
  RiAddLine,
  RiMoreLine,
  RiEditLine,
  RiToggleLine,
  RiMapPinLine,
  RiTimeLine,
  RiDoorOpenLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useState } from "react";

interface TerminalListProps {
  onCreateClick?: () => void;
  onEditClick?: (terminalId: Id<"terminals">) => void;
}

export function TerminalList({
  onCreateClick,
  onEditClick,
}: TerminalListProps) {
  const terminals = useQuery(api.terminals.queries.list, {});
  const deactivateTerminal = useMutation(api.terminals.mutations.deactivate);
  const reactivateTerminal = useMutation(api.terminals.mutations.reactivate);

  const [terminalToToggle, setTerminalToToggle] = useState<{
    id: Id<"terminals">;
    name: string;
    isActive: boolean;
  } | null>(null);

  const handleToggleStatus = async () => {
    if (!terminalToToggle) return;

    try {
      if (terminalToToggle.isActive) {
        await deactivateTerminal({ terminalId: terminalToToggle.id });
        toast.success(`Terminal "${terminalToToggle.name}" desactive`);
      } else {
        await reactivateTerminal({ terminalId: terminalToToggle.id });
        toast.success(`Terminal "${terminalToToggle.name}" reactive`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Echec de l'operation";
      toast.error(message);
    } finally {
      setTerminalToToggle(null);
    }
  };

  if (terminals === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Terminaux</h2>
          <p className="text-muted-foreground">
            Gerer les terminaux portuaires et leurs portails
          </p>
        </div>
        <Button onClick={onCreateClick}>
          <RiAddLine className="mr-2 size-4" />
          Ajouter un terminal
        </Button>
      </div>

      {terminals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Aucun terminal</p>
            <Button onClick={onCreateClick}>
              <RiAddLine className="mr-2 size-4" />
              Creer votre premier terminal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {terminals.map((terminal) => (
            <Card
              key={terminal._id}
              className="hover:shadow-md transition-shadow group/terminal"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] shrink-0 tracking-wider"
                    >
                      {terminal.code}
                    </Badge>
                    <span
                      className={`size-2 shrink-0 rounded-full ${terminal.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                      title={terminal.isActive ? "Actif" : "Inactif"}
                    />
                  </div>
                  <CardTitle className="truncate">
                    {terminal.name}
                  </CardTitle>
                  {terminal.address && (
                    <CardDescription className="flex items-center gap-1 mt-0.5">
                      <RiMapPinLine className="size-3 shrink-0" />
                      <span className="truncate">{terminal.address}</span>
                    </CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover/terminal:opacity-100 transition-opacity shrink-0"
                    >
                      <RiMoreLine className="size-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEditClick?.(terminal._id)}
                    >
                      <RiEditLine className="mr-2 size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        setTerminalToToggle({
                          id: terminal._id,
                          name: terminal.name,
                          isActive: terminal.isActive,
                        })
                      }
                      className={
                        terminal.isActive ? "text-destructive" : ""
                      }
                    >
                      <RiToggleLine className="mr-2 size-4" />
                      {terminal.isActive ? "Desactiver" : "Reactiver"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5" title="Portails actifs">
                    <RiDoorOpenLine className="size-3.5 shrink-0" />
                    <span className="font-medium text-foreground">
                      {terminal.gateCount}
                    </span>
                    <span className="text-xs">portail{terminal.gateCount !== 1 ? "s" : ""}</span>
                  </div>

                  <div
                    className="h-3 w-px bg-border shrink-0"
                    role="separator"
                  />

                  <div className="flex items-center gap-1.5 min-w-0" title="Fuseau horaire">
                    <RiTimeLine className="size-3.5 shrink-0" />
                    <span className="text-xs truncate">
                      {terminal.timezone.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="text-xs text-muted-foreground">
                <Badge
                  variant={terminal.isActive ? "default" : "secondary"}
                  className="text-[10px] h-4"
                >
                  {terminal.isActive ? "Actif" : "Inactif"}
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Toggle Status */}
      <AlertDialog
        open={terminalToToggle !== null}
        onOpenChange={(open) => !open && setTerminalToToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {terminalToToggle?.isActive ? "Desactiver" : "Reactiver"} le
              terminal ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {terminalToToggle?.isActive
                ? `Etes-vous sur de vouloir desactiver "${terminalToToggle?.name}" ? Les nouvelles reservations ne seront plus possibles pour ce terminal.`
                : `Etes-vous sur de vouloir reactiver "${terminalToToggle?.name}" ? Le terminal sera a nouveau disponible pour les reservations.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className={
                terminalToToggle?.isActive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {terminalToToggle?.isActive ? "Desactiver" : "Reactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
