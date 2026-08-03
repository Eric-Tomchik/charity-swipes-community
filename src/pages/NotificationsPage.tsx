import { useMutation, useQuery } from "convex/react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsPage() {
  const notifications = useQuery(api.notifications.list);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="size-6 text-primary" /> Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}` : "You're all caught up!"}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`rounded-xl border p-4 transition-colors ${
                n.isRead ? "bg-card" : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{n.title}</div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  {n.linkTo && (
                    <Link to={n.linkTo} className="text-sm text-primary hover:underline">
                      View →
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(n.createdAt)}
                  </span>
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => markAsRead({ notificationId: n._id })}
                      className="size-2 rounded-full bg-primary shrink-0"
                      title="Mark as read"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border p-12 text-center">
          <Bell className="size-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            You'll see updates here when you get ticket replies, application updates, and more.
          </p>
        </div>
      )}
    </div>
  );
}
