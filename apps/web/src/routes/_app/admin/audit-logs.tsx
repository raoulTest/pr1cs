import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";
import { useState } from "react";
import {
  ScrollTextIcon,
  FilterIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  ClockIcon,
  ActivityIcon,
  XIcon,
  EyeIcon,
  BotIcon,
  ShieldAlertIcon,
  LogInIcon,
  LogOutIcon,
  ZapIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import type { Id } from "@microhack/backend/convex/_generated/dataModel";

export const Route = createFileRoute("/_app/admin/audit-logs")({
  component: AuditLogsPage,
});

type AuditAction =
  | "query"
  | "mutation"
  | "ai_tool_call"
  | "login"
  | "logout"
  | "failed_auth"
  | "permission_denied";

const ACTION_CONFIG: Record<
  AuditAction,
  { label: string; icon: typeof ZapIcon; color: string }
> = {
  query: { label: "Requete", icon: SearchIcon, color: "bg-blue-500" },
  mutation: { label: "Mutation", icon: ZapIcon, color: "bg-green-500" },
  ai_tool_call: { label: "Outil IA", icon: BotIcon, color: "bg-purple-500" },
  login: { label: "Connexion", icon: LogInIcon, color: "bg-cyan-500" },
  logout: { label: "Deconnexion", icon: LogOutIcon, color: "bg-gray-500" },
  failed_auth: {
    label: "Echec auth",
    icon: ShieldAlertIcon,
    color: "bg-red-500",
  },
  permission_denied: {
    label: "Acces refuse",
    icon: ShieldAlertIcon,
    color: "bg-orange-500",
  },
};

interface AuditLog {
  _id: Id<"auditLogs">;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  args?: string;
  result?: string;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  aiThreadId?: string;
  aiToolName?: string;
  timestamp: number;
  durationMs?: number;
}

function AuditLogsPage() {
  // Filter states
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<
    "all" | "success" | "error"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Queries
  const stats = useQuery(api.audit.queries.getStats, {});
  const distinctResources = useQuery(api.audit.queries.getDistinctResources, {});
  const logsData = useQuery(api.audit.queries.list, {
    limit: 25,
    cursor,
    action: actionFilter !== "all" ? actionFilter : undefined,
    resource: resourceFilter !== "all" ? resourceFilter : undefined,
    resultFilter: resultFilter !== "all" ? resultFilter : undefined,
  });

  const isLoading =
    stats === undefined ||
    logsData === undefined ||
    distinctResources === undefined;

  // Filter logs by search query (client-side)
  const filteredLogs =
    logsData?.logs.filter((log) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        log.resource.toLowerCase().includes(query) ||
        log.userName?.toLowerCase().includes(query) ||
        log.userEmail?.toLowerCase().includes(query) ||
        log.resourceId?.toLowerCase().includes(query) ||
        log.errorMessage?.toLowerCase().includes(query)
      );
    }) ?? [];

  const handleNextPage = () => {
    if (logsData?.nextCursor) {
      setCursorHistory((prev) => [...prev, cursor ?? ""]);
      setCursor(logsData.nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const prevCursor = newHistory.pop();
      setCursorHistory(newHistory);
      setCursor(prevCursor || undefined);
    }
  };

  const resetFilters = () => {
    setActionFilter("all");
    setResourceFilter("all");
    setResultFilter("all");
    setSearchQuery("");
    setCursor(undefined);
    setCursorHistory([]);
  };

  const openDetailDialog = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const getActionBadge = (action: AuditAction) => {
    const config = ACTION_CONFIG[action];
    if (!config) return <Badge variant="secondary">{action}</Badge>;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="size-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getResultBadge = (log: AuditLog) => {
    if (log.errorMessage || log.result?.startsWith("error")) {
      return (
        <Badge variant="destructive">
          <AlertTriangleIcon className="size-3 mr-1" />
          Erreur
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-green-600 border-green-600"
      >
        <CheckCircleIcon className="size-3 mr-1" />
        Succes
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "A l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const hasFilters =
    actionFilter !== "all" ||
    resourceFilter !== "all" ||
    resultFilter !== "all" ||
    searchQuery !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollTextIcon className="size-6" />
            Journal d'audit
          </h1>
          <p className="text-muted-foreground">
            Historique complet des actions systeme
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total (24h)
            </CardTitle>
            <ActivityIcon className="size-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLogs ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Succes</CardTitle>
            <CheckCircleIcon className="size-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.successCount ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <AlertTriangleIcon className="size-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.errorCount ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Types d'actions
            </CardTitle>
            <ZapIcon className="size-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byAction.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity by Action Type */}
      {stats && stats.byAction.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Repartition par action (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.byAction.map(({ action, count }) => (
                <div
                  key={action}
                  className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md"
                >
                  {getActionBadge(action as AuditAction)}
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="size-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <Select
              value={actionFilter}
              onValueChange={(v) => {
                setActionFilter(v as AuditAction | "all");
                setCursor(undefined);
                setCursorHistory([]);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={resourceFilter}
              onValueChange={(v) => {
                setResourceFilter(v);
                setCursor(undefined);
                setCursorHistory([]);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ressource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les ressources</SelectItem>
                {distinctResources?.map((resource) => (
                  <SelectItem key={resource} value={resource}>
                    {resource}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={resultFilter}
              onValueChange={(v) => {
                setResultFilter(v as "all" | "success" | "error");
                setCursor(undefined);
                setCursorHistory([]);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Resultat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="success">Succes</SelectItem>
                <SelectItem value="error">Erreurs</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="outline" onClick={resetFilters}>
                <XIcon className="size-4 mr-2" />
                Reinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>
            {filteredLogs.length} entree(s) affichee(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead>Resultat</TableHead>
                <TableHead>Duree</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Aucun log trouve
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {formatRelativeTime(log.timestamp)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="size-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm truncate max-w-[150px]">
                            {log.userName || log.userEmail || "Anonyme"}
                          </span>
                          {log.userName && log.userEmail && (
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {log.userEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {log.resource}
                      </code>
                    </TableCell>
                    <TableCell>{getResultBadge(log)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ClockIcon className="size-3" />
                        <span className="text-xs">
                          {formatDuration(log.durationMs)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailDialog(log)}
                      >
                        <EyeIcon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={cursorHistory.length === 0}
            >
              <ChevronLeftIcon className="size-4 mr-2" />
              Precedent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {cursorHistory.length + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!logsData?.hasMore}
            >
              Suivant
              <ChevronRightIcon className="size-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollTextIcon className="size-5" />
              Details du log
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatTimestamp(selectedLog.timestamp)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Action
                  </label>
                  <div className="mt-1">
                    {getActionBadge(selectedLog.action)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Resultat
                  </label>
                  <div className="mt-1">{getResultBadge(selectedLog)}</div>
                </div>
              </div>

              {/* User Info */}
              <div className="p-3 bg-muted rounded-lg">
                <label className="text-sm font-medium text-muted-foreground">
                  Utilisateur
                </label>
                <div className="mt-1 space-y-1">
                  {selectedLog.userName && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="size-4" />
                      <span>{selectedLog.userName}</span>
                    </div>
                  )}
                  {selectedLog.userEmail && (
                    <div className="text-sm text-muted-foreground">
                      {selectedLog.userEmail}
                    </div>
                  )}
                  {selectedLog.userId && (
                    <div className="text-xs text-muted-foreground font-mono">
                      ID: {selectedLog.userId}
                    </div>
                  )}
                  {!selectedLog.userId && (
                    <span className="text-muted-foreground">Anonyme</span>
                  )}
                </div>
              </div>

              {/* Resource */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ressource
                </label>
                <div className="mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {selectedLog.resource}
                  </code>
                  {selectedLog.resourceId && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ID: {selectedLog.resourceId}
                    </span>
                  )}
                </div>
              </div>

              {/* Duration */}
              {selectedLog.durationMs && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Duree d'execution
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <ClockIcon className="size-4" />
                    <span>{formatDuration(selectedLog.durationMs)}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedLog.errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <label className="text-sm font-medium text-red-600">
                    Message d'erreur
                  </label>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              {/* Arguments */}
              {selectedLog.args && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Arguments (sanitises)
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.args), null, 2)}
                  </pre>
                </div>
              )}

              {/* AI Info */}
              {(selectedLog.aiThreadId || selectedLog.aiToolName) && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <label className="text-sm font-medium text-purple-600 flex items-center gap-2">
                    <BotIcon className="size-4" />
                    Information IA
                  </label>
                  <div className="mt-2 space-y-1 text-sm">
                    {selectedLog.aiToolName && (
                      <div>
                        <span className="text-muted-foreground">Outil:</span>{" "}
                        <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">
                          {selectedLog.aiToolName}
                        </code>
                      </div>
                    )}
                    {selectedLog.aiThreadId && (
                      <div>
                        <span className="text-muted-foreground">Thread:</span>{" "}
                        <code className="text-xs">{selectedLog.aiThreadId}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Context Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedLog.ipAddress && (
                  <div>
                    <label className="text-muted-foreground">
                      Adresse IP
                    </label>
                    <div className="font-mono">{selectedLog.ipAddress}</div>
                  </div>
                )}
                {selectedLog.sessionId && (
                  <div>
                    <label className="text-muted-foreground">Session</label>
                    <div className="font-mono text-xs truncate">
                      {selectedLog.sessionId}
                    </div>
                  </div>
                )}
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User Agent
                  </label>
                  <div className="mt-1 text-xs text-muted-foreground break-all">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}

              {/* Log ID */}
              <div className="pt-4 border-t">
                <label className="text-xs text-muted-foreground">
                  ID du log
                </label>
                <div className="font-mono text-xs">{selectedLog._id}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
