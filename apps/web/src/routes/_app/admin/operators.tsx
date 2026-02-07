import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import type { Id } from "@microhack/backend/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { UserCogIcon, BuildingIcon, PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/admin/operators")({
  component: OperatorsPage,
});

function OperatorsPage() {
  const [editingOperator, setEditingOperator] = useState<string | null>(null);
  const [selectedTerminals, setSelectedTerminals] = useState<Id<"terminals">[]>([]);

  const operators = useQuery(api.users.queries.listOperators, {});
  const terminals = useQuery(api.terminals.queries.list, { activeOnly: true });
  const allOperatorUsers = useQuery(api.users.queries.listByRole, { role: "terminal_operator" });

  const assignTerminals = useMutation(api.users.mutations.assignOperatorToTerminals);
  const removeFromTerminal = useMutation(api.users.mutations.removeOperatorFromTerminal);

  const isLoading = operators === undefined || terminals === undefined || allOperatorUsers === undefined;

  const handleAssignTerminals = async () => {
    if (!editingOperator) return;

    try {
      await assignTerminals({
        userId: editingOperator,
        terminalIds: selectedTerminals,
      });
      toast.success("Terminaux assignes avec succes");
      setEditingOperator(null);
      setSelectedTerminals([]);
    } catch (error) {
      toast.error("Erreur lors de l'assignation des terminaux");
    }
  };

  const handleRemoveFromTerminal = async (userId: string, terminalId: Id<"terminals">) => {
    try {
      await removeFromTerminal({ userId, terminalId });
      toast.success("Operateur retire du terminal");
    } catch (error) {
      toast.error("Erreur lors du retrait de l'operateur");
    }
  };

  const getTerminalName = (terminalId: Id<"terminals">) => {
    const terminal = terminals?.find((t) => t._id === terminalId);
    return terminal?.name ?? terminalId;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCogIcon className="size-6" />
            Gestion des operateurs
          </h1>
          <p className="text-muted-foreground">
            Assigner des operateurs aux terminaux
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Operateurs actifs</CardTitle>
            <UserCogIcon className="size-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operators?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Terminaux</CardTitle>
            <BuildingIcon className="size-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{terminals?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs operateurs</CardTitle>
            <UserCogIcon className="size-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allOperatorUsers?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Operators Table */}
      <Card>
        <CardHeader>
          <CardTitle>Operateurs et terminaux assignes</CardTitle>
          <CardDescription>
            Gerer les assignations d'operateurs aux terminaux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operateur</TableHead>
                <TableHead>Terminaux assignes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allOperatorUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Aucun utilisateur avec le role operateur.
                    <br />
                    <span className="text-sm">
                      Attribuez d'abord le role "Operateur terminal" a un utilisateur dans la page Utilisateurs.
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                allOperatorUsers?.map((user) => {
                  const operatorAssignments = operators?.find((o) => o.userId === user.userId);
                  const assignedTerminals = operatorAssignments?.assignedTerminals ?? [];

                  return (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name ?? user.email}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignedTerminals.length === 0 ? (
                          <span className="text-muted-foreground text-sm">Aucun terminal</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedTerminals.map((terminalId) => (
                              <Badge 
                                key={terminalId} 
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {getTerminalName(terminalId)}
                                <button
                                  onClick={() => handleRemoveFromTerminal(user.userId, terminalId)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <XIcon className="size-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOperator(user.userId);
                            setSelectedTerminals(assignedTerminals);
                          }}
                        >
                          <PlusIcon className="size-4 mr-1" />
                          Gerer
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Terminals Dialog */}
      <Dialog open={!!editingOperator} onOpenChange={() => setEditingOperator(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner des terminaux</DialogTitle>
            <DialogDescription>
              Selectionnez les terminaux que cet operateur peut gerer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {terminals?.map((terminal) => (
                <div key={terminal._id} className="flex items-center space-x-3">
                  <Checkbox
                    id={terminal._id}
                    checked={selectedTerminals.includes(terminal._id)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSelectedTerminals([...selectedTerminals, terminal._id]);
                      } else {
                        setSelectedTerminals(selectedTerminals.filter((id) => id !== terminal._id));
                      }
                    }}
                  />
                  <Label htmlFor={terminal._id} className="flex-1">
                    <span className="font-medium">{terminal.name}</span>
                    <span className="text-muted-foreground ml-2">({terminal.code})</span>
                  </Label>
                </div>
              ))}
              {terminals?.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun terminal disponible</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingOperator(null)}>
                Annuler
              </Button>
              <Button onClick={handleAssignTerminals}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
