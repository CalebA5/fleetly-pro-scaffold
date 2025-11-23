import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export function NotificationBell() {
  const { unreadNotifications, unreadCount, markAsRead } = useNotifications();
  const [, setLocation] = useLocation();

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    markAsRead(notification.notificationId);

    // Navigate to the action URL if available
    if (notification.metadata?.actionUrl) {
      setLocation(notification.metadata.actionUrl);
    } else if (notification.requestId) {
      // Default navigation based on type and audience role
      if (notification.audienceRole === "customer") {
        if (notification.type === "quote_received") {
          setLocation(`/customer/request-status?highlight=${notification.requestId}`);
        } else {
          setLocation(`/customer/request-status`);
        }
      } else if (notification.audienceRole === "operator") {
        setLocation(`/operator/nearby-jobs?highlight=${notification.requestId}`);
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-semibold"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" data-testid="popover-notifications">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {unreadNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                No new notifications
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {unreadNotifications.map((notification) => (
                <button
                  key={notification.notificationId}
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                  data-testid={`notification-${notification.notificationId}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {unreadNotifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setLocation("/notifications")}
                data-testid="button-view-all"
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
