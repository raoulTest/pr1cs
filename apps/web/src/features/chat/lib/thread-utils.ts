interface Thread {
  _id: string;
  title?: string;
  createdAt: number;
}

interface GroupedThreads {
  today: Thread[];
  yesterday: Thread[];
  last7days: Thread[];
  last30days: Thread[];
  older: Thread[];
}

export function groupThreadsByDate(threads: Thread[]): GroupedThreads {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const last7days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const grouped: GroupedThreads = {
    today: [],
    yesterday: [],
    last7days: [],
    last30days: [],
    older: [],
  };

  // Sort threads by createdAt descending
  const sortedThreads = [...threads].sort((a, b) => b.createdAt - a.createdAt);

  for (const thread of sortedThreads) {
    const date = new Date(thread.createdAt);

    if (date >= today) {
      grouped.today.push(thread);
    } else if (date >= yesterday) {
      grouped.yesterday.push(thread);
    } else if (date >= last7days) {
      grouped.last7days.push(thread);
    } else if (date >= last30days) {
      grouped.last30days.push(thread);
    } else {
      grouped.older.push(thread);
    }
  }

  return grouped;
}

export function formatThreadDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  if (date >= today) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else if (date >= yesterday) {
    return "Hier";
  } else {
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
}
