"use client";

import { useRouter } from "next/navigation";
import type { NotificationData } from "@/hooks/use-notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";

interface NotificationDropdownProps {
  notifications: NotificationData[];
  loading: boolean;
  onMarkAsRead: (ids: string[]) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onClose: () => void;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d`;
}

export function NotificationDropdown({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();

  function handleClick(notification: NotificationData) {
    if (!notification.read) {
      onMarkAsRead([notification.id]);
    }
    if (notification.href) {
      router.push(notification.href);
      onClose();
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border/50 bg-card shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/20 last:border-0 ${
                !notification.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                {!notification.read && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                )}
                <div className={`flex-1 min-w-0 ${notification.read ? "ml-4" : ""}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold truncate">
                      {notification.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.body}
                  </p>
                  {notification.href && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-primary mt-1">
                      <ExternalLink className="h-2.5 w-2.5" />
                      View
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
