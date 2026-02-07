"use client";

import { MessageSquareIcon, TruckIcon, CalendarIcon, PackageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ChatEmptyStateProps {
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  const suggestions = [
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
      title: "Aide generale",
      description: "Comment fonctionne le systeme de reservation ?",
    },
  ];

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
