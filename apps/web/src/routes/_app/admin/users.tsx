import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { 
  UsersIcon, 
  ShieldIcon, 
  UserIcon, 
  TruckIcon, 
  BuildingIcon,
  PlusIcon,
  PencilIcon,
  BanIcon,
  TrashIcon,
  KeyIcon,
  MoreHorizontalIcon,
  CheckCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export const Route = createFileRoute("/_app/admin/users")({
  component: UsersPage,
});

const ROLES = [
  { value: "user", label: "Utilisateur", icon: UserIcon, color: "bg-gray-500" },
  { value: "carrier", label: "Transporteur", icon: TruckIcon, color: "bg-green-500" },
  { value: "terminal_operator", label: "Operateur terminal", icon: BuildingIcon, color: "bg-blue-500" },
  { value: "port_admin", label: "Administrateur port", icon: ShieldIcon, color: "bg-red-500" },
] as const;

type Role = typeof ROLES[number]["value"];

interface UserData {
  userId: string;
  email: string;
  name: string;
  role: string;
  createdAt: number;
  emailVerified: boolean;
  banned?: boolean | null;
}

function UsersPage() {
  const [selectedRole, setSelectedRole] = useState<Role | "all">("all");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Selected user for operations
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState({ email: "", password: "", name: "", role: "carrier" as Role });
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [newRole, setNewRole] = useState<Role>("user");
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch ALL users from Better Auth component
  const allUsersData = useQuery(api.users.queries.listAllUsers);

  // Mutations
  const createUserMutation = useMutation(api.users.mutations.createUser);
  const updateUserMutation = useMutation(api.users.mutations.updateUser);
  const setRoleMutation = useMutation(api.users.mutations.setRole);
  const banUserMutation = useMutation(api.users.mutations.banUser);
  const unbanUserMutation = useMutation(api.users.mutations.unbanUser);
  const removeUserMutation = useMutation(api.users.mutations.removeUser);
  const resetPasswordMutation = useMutation(api.users.mutations.resetUserPassword);

  const isLoading = allUsersData === undefined;
  const allUsers = allUsersData ?? [];
  const filteredUsers = selectedRole === "all" 
    ? allUsers 
    : allUsers.filter((u) => u.role === selectedRole);

  // Handlers
  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.name) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createUserMutation({
        email: createForm.email,
        password: createForm.password,
        name: createForm.name,
        role: createForm.role,
      });
      toast.success("Utilisateur cree avec succes");
      setCreateDialogOpen(false);
      setCreateForm({ email: "", password: "", name: "", role: "carrier" });
    } catch (error: any) {
      toast.error(error.data?.message || "Erreur lors de la creation de l'utilisateur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await updateUserMutation({
        userId: selectedUser.userId,
        name: editForm.name || undefined,
        email: editForm.email || undefined,
      });
      toast.success("Utilisateur mis a jour avec succes");
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.data?.message || "Erreur lors de la mise a jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetRole = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await setRoleMutation({
        userId: selectedUser.userId,
        role: newRole,
      });
      toast.success("Role mis a jour avec succes");
      setRoleDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.data?.message || "Erreur lors de la mise a jour du role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await banUserMutation({
        userId: selectedUser.userId,
        reason: banReason || undefined,
        expiresInDays: banDays ? parseInt(banDays) : undefined,
      });
      toast.success("Utilisateur banni avec succes");
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason("");
      setBanDays("");
    } catch (error: any) {
      toast.error(error.data?.message || "Erreur lors du bannissement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnbanUser = async (user: UserData) => {
    try {
      await unbanUserMutation({ userId: user.userId });
      toast.success("Utilisateur debanni avec succes");
    } catch (error: any) {
      toast.error(error.data?.message || "Erreur lors du debannissement");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await removeUserMutation({ userId: selectedUser.userId });
      toast.success("Utilisateur supprime avec succes");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.data?.message || "Erreur lors de la suppression");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caracteres");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await resetPasswordMutation({
        userId: selectedUser.userId,
        newPassword: newPassword,
      });
      toast.success("Mot de passe reinitialise avec succes");
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.data?.message || "Erreur lors de la reinitialisation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLES.find((r) => r.value === role);
    if (!roleConfig) return <Badge variant="secondary">{role}</Badge>;
    
    const Icon = roleConfig.icon;
    return (
      <Badge className={`${roleConfig.color} text-white`}>
        <Icon className="size-3 mr-1" />
        {roleConfig.label}
      </Badge>
    );
  };

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email });
    setEditDialogOpen(true);
  };

  const openRoleDialog = (user: UserData) => {
    setSelectedUser(user);
    setNewRole(user.role as Role);
    setRoleDialogOpen(true);
  };

  const openBanDialog = (user: UserData) => {
    setSelectedUser(user);
    setBanReason("");
    setBanDays("");
    setBanDialogOpen(true);
  };

  const openDeleteDialog = (user: UserData) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const openPasswordDialog = (user: UserData) => {
    setSelectedUser(user);
    setNewPassword("");
    setPasswordDialogOpen(true);
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
            <UsersIcon className="size-6" />
            Gestion des utilisateurs
          </h1>
          <p className="text-muted-foreground">
            Creer, modifier et gerer les utilisateurs du systeme
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="size-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {ROLES.map((role) => {
          const count = allUsers.filter((u) => u.role === role.value).length;
          const Icon = role.icon;
          return (
            <Card 
              key={role.value}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                selectedRole === role.value ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedRole(selectedRole === role.value ? "all" : role.value)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{role.label}</CardTitle>
                <Icon className={`size-5 text-white p-1 rounded ${role.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedRole === "all" ? "Tous les utilisateurs" : ROLES.find((r) => r.value === selectedRole)?.label}
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} utilisateur(s) trouve(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun utilisateur trouve
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">Banni</Badge>
                      ) : user.emailVerified ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">Verifie</Badge>
                      ) : (
                        <Badge variant="secondary">Non verifie</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <PencilIcon className="size-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                            <ShieldIcon className="size-4 mr-2" />
                            Changer le role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                            <KeyIcon className="size-4 mr-2" />
                            Reinitialiser mot de passe
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.banned ? (
                            <DropdownMenuItem onClick={() => handleUnbanUser(user)}>
                              <CheckCircleIcon className="size-4 mr-2" />
                              Debannir
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => openBanDialog(user)}
                              className="text-orange-600"
                            >
                              <BanIcon className="size-4 mr-2" />
                              Bannir
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(user)}
                            className="text-destructive"
                          >
                            <TrashIcon className="size-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Creer un utilisateur</DialogTitle>
            <DialogDescription>
              Creer un nouveau compte utilisateur avec email et mot de passe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom complet</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="jean.dupont@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mot de passe</label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Minimum 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select 
                value={createForm.role} 
                onValueChange={(v) => setCreateForm({ ...createForm, role: v as Role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4 mr-2" />}
              Creer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifier les informations de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom complet</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4 mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le role</DialogTitle>
            <DialogDescription>
              Changer le role de l'utilisateur affectera ses permissions dans le systeme.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouveau role</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSetRole} disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4 mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bannir l'utilisateur</DialogTitle>
            <DialogDescription>
              L'utilisateur ne pourra plus se connecter. Toutes ses sessions seront revoquees.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Raison (optionnel)</label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ex: Violation des conditions d'utilisation"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duree en jours (optionnel)</label>
              <Input
                type="number"
                value={banDays}
                onChange={(e) => setBanDays(e.target.value)}
                placeholder="Laisser vide pour un ban permanent"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleBanUser} disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4 mr-2" />}
              Bannir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Definir un nouveau mot de passe pour l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouveau mot de passe</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleResetPassword} disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4 mr-2" />}
              Reinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. L'utilisateur <strong>{selectedUser?.email}</strong> sera 
              definitivement supprime du systeme, ainsi que toutes ses donnees associees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Spinner className="size-4 mr-2" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
