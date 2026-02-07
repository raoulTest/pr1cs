/**
 * Notification Empty State
 * Shown when user has no notifications
 */
import { BellOffIcon } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export function NotificationEmpty() {
  return (
    <Empty className="py-8 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BellOffIcon />
        </EmptyMedia>
        <EmptyTitle>Aucune notification</EmptyTitle>
        <EmptyDescription>
          Vous n'avez pas de nouvelles notifications pour le moment.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
