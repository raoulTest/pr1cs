import { useQuery } from "convex/react";
import { api } from "@microhack/backend/convex/_generated/api";

/**
 * Thread type from the agent component
 */
export interface Thread {
  _id: string;
  _creationTime: number;
  userId: string;
  title?: string;
  summary?: string;
  status?: string;
}

/**
 * Hook to list user's threads.
 */
export function useThreads(userId: string | undefined) {
  const result = useQuery(
    api.ai.queries.listUserThreads,
    userId ? { userId, limit: 50 } : "skip"
  );

  // The result is paginated, extract the page
  const threads = (result?.page ?? []) as Thread[];
  const isLoading = result === undefined;

  return {
    threads,
    isLoading,
  };
}
