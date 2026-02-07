import type { ChartConfig } from "@/components/ui/chart";

// ============================================================================
// FRENCH LABELS
// ============================================================================

export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  rejected: "Rejeté",
  consumed: "Consommé",
  cancelled: "Annulé",
  expired: "Expiré",
};

export const CONTAINER_TYPE_LABELS: Record<string, string> = {
  dry: "Standard",
  reefer: "Réfrigéré",
  open_top: "Toit ouvert",
  flat_rack: "Flat rack",
  tank: "Citerne",
  hazardous: "Dangereux",
};

export const CONTAINER_DIMENSION_LABELS: Record<string, string> = {
  "20ft": "20 pieds",
  "40ft": "40 pieds",
  "40ft_hc": "40 pieds HC",
  "45ft": "45 pieds",
};

export const OPERATION_LABELS: Record<string, string> = {
  pick_up: "Enlèvement",
  drop_off: "Dépôt",
};

export const TRUCK_TYPE_LABELS: Record<string, string> = {
  container: "Porte-conteneurs",
  flatbed: "Plateau",
  tanker: "Citerne",
  refrigerated: "Frigorifique",
  bulk: "Vrac",
  general: "Général",
};

export const TRUCK_CLASS_LABELS: Record<string, string> = {
  light: "Léger",
  medium: "Moyen",
  heavy: "Lourd",
  super_heavy: "Très lourd",
};

// ============================================================================
// CHART CONFIGS
// ============================================================================

export const bookingStatusChartConfig: ChartConfig = {
  pending: {
    label: "En attente",
    color: "var(--chart-3)",
  },
  confirmed: {
    label: "Confirmé",
    color: "var(--chart-2)",
  },
  rejected: {
    label: "Rejeté",
    color: "var(--chart-4)",
  },
  consumed: {
    label: "Consommé",
    color: "var(--chart-1)",
  },
  cancelled: {
    label: "Annulé",
    color: "var(--chart-5)",
  },
  expired: {
    label: "Expiré",
    color: "hsl(var(--muted-foreground))",
  },
};

export const bookingTrendsChartConfig: ChartConfig = {
  confirmed: {
    label: "Confirmé",
    color: "var(--chart-2)",
  },
  pending: {
    label: "En attente",
    color: "var(--chart-3)",
  },
  rejected: {
    label: "Rejeté",
    color: "var(--chart-4)",
  },
  consumed: {
    label: "Consommé",
    color: "var(--chart-1)",
  },
  cancelled: {
    label: "Annulé",
    color: "var(--chart-5)",
  },
};

export const terminalComparisonChartConfig: ChartConfig = {
  confirmed: {
    label: "Confirmé",
    color: "var(--chart-2)",
  },
  pending: {
    label: "En attente",
    color: "var(--chart-3)",
  },
  rejected: {
    label: "Rejeté",
    color: "var(--chart-4)",
  },
};

export const hourlyDistributionChartConfig: ChartConfig = {
  bookings: {
    label: "Réservations",
    color: "var(--chart-1)",
  },
};

export const containerTypeChartConfig: ChartConfig = {
  dry: { label: "Standard", color: "var(--chart-1)" },
  reefer: { label: "Réfrigéré", color: "var(--chart-2)" },
  open_top: { label: "Toit ouvert", color: "var(--chart-3)" },
  flat_rack: { label: "Flat rack", color: "var(--chart-4)" },
  tank: { label: "Citerne", color: "var(--chart-5)" },
  hazardous: { label: "Dangereux", color: "hsl(var(--muted-foreground))" },
};

export const containerDimensionsChartConfig: ChartConfig = {
  "20ft": { label: "20 pieds", color: "var(--chart-1)" },
  "40ft": { label: "40 pieds", color: "var(--chart-2)" },
  "40ft_hc": { label: "40 pieds HC", color: "var(--chart-3)" },
  "45ft": { label: "45 pieds", color: "var(--chart-4)" },
};

export const operationsChartConfig: ChartConfig = {
  pick_up: {
    label: "Enlèvement",
    color: "var(--chart-1)",
  },
  drop_off: {
    label: "Dépôt",
    color: "var(--chart-3)",
  },
};

export const truckFleetChartConfig: ChartConfig = {
  light: { label: "Léger", color: "var(--chart-1)" },
  medium: { label: "Moyen", color: "var(--chart-2)" },
  heavy: { label: "Lourd", color: "var(--chart-3)" },
  super_heavy: { label: "Très lourd", color: "var(--chart-4)" },
};

export const operatorProcessingChartConfig: ChartConfig = {
  autoValidated: {
    label: "Auto-validé",
    color: "var(--chart-2)",
  },
  manuallyProcessed: {
    label: "Traitement manuel",
    color: "var(--chart-3)",
  },
};

export const systemActivityChartConfig: ChartConfig = {
  count: {
    label: "Actions",
    color: "var(--chart-1)",
  },
};
