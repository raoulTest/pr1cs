"use client";

import { 
  MessageSquareIcon, 
  TruckIcon, 
  CalendarIcon, 
  PackageIcon,
  ClockIcon,
  BuildingIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole, type ApcsRole } from "@/hooks/use-role";

interface SuggestionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

function Suggestion({ icon, title, description, onClick }: SuggestionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left",
        "transition-colors hover:bg-accent hover:border-accent-foreground/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

// Role-specific suggestions (French)
const ROLE_SUGGESTIONS: Record<ApcsRole, Array<{
  icon: React.ReactNode;
  title: string;
  description: string;
}>> = {
  carrier: [
    {
      icon: <CalendarIcon className="size-4" />,
      title: "Reserver un creneau",
      description: "Je veux reserver un creneau pour demain matin au terminal TC1",
    },
    {
      icon: <TruckIcon className="size-4" />,
      title: "Mes reservations",
      description: "Montre-moi la liste de mes reservations en cours",
    },
    {
      icon: <PackageIcon className="size-4" />,
      title: "Mes conteneurs",
      description: "Quels conteneurs sont disponibles pour une reservation ?",
    },
    {
      icon: <MessageSquareIcon className="size-4" />,
      title: "Annuler une reservation",
      description: "Je veux annuler ma reservation de demain",
    },
  ],
  terminal_operator: [
    {
      icon: <CalendarIcon className="size-4" />,
      title: "Reservations du terminal",
      description: "Montre-moi toutes les reservations du terminal TC1 pour aujourd'hui",
    },
    {
      icon: <ClockIcon className="size-4" />,
      title: "Reservations en attente",
      description: "Quelles reservations sont en attente de validation ?",
    },
    {
      icon: <TruckIcon className="size-4" />,
      title: "Disponibilite des creneaux",
      description: "Quels creneaux sont disponibles demain ?",
    },
    {
      icon: <MessageSquareIcon className="size-4" />,
      title: "Aide generale",
      description: "Comment fonctionne le systeme de reservation ?",
    },
  ],
  port_admin: [
    {
      icon: <BuildingIcon className="size-4" />,
      title: "Vue d'ensemble",
      description: "Montre-moi un resume de l'activite portuaire aujourd'hui",
    },
    {
      icon: <CalendarIcon className="size-4" />,
      title: "Toutes les reservations",
      description: "Liste toutes les reservations en cours sur tous les terminaux",
    },
    {
      icon: <TruckIcon className="size-4" />,
      title: "Reservations par transporteur",
      description: "Montre-moi les reservations du transporteur XYZ",
    },
    {
      icon: <SettingsIcon className="size-4" />,
      title: "Configuration systeme",
      description: "Quelles sont les politiques de reservation actuelles ?",
    },
  ],
};

// Fallback suggestions for unauthenticated/unknown role
const DEFAULT_SUGGESTIONS = [
  {
    icon: <MessageSquareIcon className="size-4" />,
    title: "Aide generale",
    description: "Comment fonctionne le systeme de reservation ?",
  },
];

interface ChatEmptyStateProps {
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  const role = useRole();
  
  // Get role-specific suggestions or fallback
  const suggestions = role 
    ? ROLE_SUGGESTIONS[role] ?? DEFAULT_SUGGESTIONS
    : DEFAULT_SUGGESTIONS;

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bienvenue sur APCS
          </h1>
          <p className="text-muted-foreground">
            Systeme de reservation de creneaux portuaires. Comment puis-je vous aider ?
          </p>
        </div>

        {/* Suggestions grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion.title}
              icon={suggestion.icon}
              title={suggestion.title}
              description={suggestion.description}
              onClick={() => onSuggestionClick?.(suggestion.description)}
            />
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground">
          Tapez votre message ci-dessous ou cliquez sur une suggestion pour commencer.
        </p>
      </div>
    </div>
  );
}
