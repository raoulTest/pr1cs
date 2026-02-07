"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupThreadsByDate } from "../lib/thread-utils";
import { useThreads } from "../hooks/use-threads";
import { useCurrentUser } from "@/hooks/use-role";

interface ThreadWithDate {
  _id: string;
  _creationTime: number;
  title?: string;
  createdAt: number;
}

const DATE_GROUP_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  last7days: "7 derniers jours",
  last30days: "30 derniers jours",
  older: "Plus ancien",
};

export function ChatSidebarThreads() {
  const user = useCurrentUser();
  const { threads, isLoading } = useThreads(user?._id);

  // Get current thread ID from URL search params
  const currentThreadId = typeof window !== "undefined" 
    ? new URLSearchParams(window.location.search).get("thread") 
    : null;

  // Transform threads for grouping (add createdAt from _creationTime)
  const threadsWithDate: ThreadWithDate[] = threads.map((thread) => ({
    ...thread,
    createdAt: thread._creationTime,
  }));

  if (isLoading) {
    return (
      <div className="px-3 py-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <MessageCircleIcon className="size-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Aucune conversation
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Commencez une nouvelle conversation
        </p>
      </div>
    );
  }

  const groupedThreads = groupThreadsByDate(threadsWithDate);

  return (
    <div className="px-2 py-3 space-y-4">
      {Object.entries(groupedThreads).map(([group, groupThreads]) => {
        if (groupThreads.length === 0) return null;

        return (
          <div key={group}>
            <h3 className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {DATE_GROUP_LABELS[group]}
            </h3>
            <div className="space-y-1">
              {groupThreads.map((thread: ThreadWithDate) => (
                <a
                  key={thread._id}
                  href={`/ai-booking?thread=${thread._id}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                    "hover:bg-muted transition-colors",
                    "truncate",
                    currentThreadId === thread._id && "bg-muted"
                  )}
                >
                  <MessageCircleIcon className="size-4 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {thread.title || "Nouvelle conversation"}
                  </span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
