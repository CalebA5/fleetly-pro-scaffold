import { Bell, CloudSnow, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useLocation as useWouterLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUserLocation } from "@/contexts/LocationContext";

export function NotificationBell() {
  const { unreadNotifications, unreadCount, markAsRead } = useNotifications();
  const [, setLocation] = useWouterLocation();
  const { location: userLocation } = useUserLocation();
  
  // Fetch weather alerts for user's location
  const { data: weatherAlerts = [] } = useQuery<any[]>({
    queryKey: ['/api/weather/alerts/severe'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
  
  // Filter weather alerts by user's location (within 50km radius)
  const localWeatherAlerts = weatherAlerts.filter((alert) => {
    // Skip alerts without valid coordinates
    if (!alert.latitude || !alert.longitude) return false;
    
    // If no user location, don't show any location-based alerts
    if (!userLocation) return false;
    
    const userLat = userLocation.coords.latitude;
    const userLon = userLocation.coords.longitude;
    const alertLat = parseFloat(alert.latitude);
    const alertLon = parseFloat(alert.longitude);
    
    // Haversine distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (alertLat - userLat) * Math.PI / 180;
    const dLon = (alertLon - userLon) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(alertLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance <= 50; // Within 50km
  });
  
  const totalUnreadCount = unreadCount + localWeatherAlerts.length;

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
          {totalUnreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-semibold"
              data-testid="badge-unread-count"
            >
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" data-testid="popover-notifications">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications & Alerts</h3>
          {totalUnreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalUnreadCount} new
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[450px]">
          {unreadNotifications.length === 0 && localWeatherAlerts.length === 0 ? (
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
              {/* Weather Alerts Section */}
              {localWeatherAlerts.length > 0 && (
                <>
                  {localWeatherAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-l-4 border-red-500"
                      data-testid={`weather-alert-${alert.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                          {alert.event?.includes('Winter') || alert.event?.includes('Snow') ? (
                            <CloudSnow className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-red-900 dark:text-red-100">
                              {alert.event}
                            </p>
                            <Badge variant="destructive" className="text-xs">
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-red-700 dark:text-red-300 line-clamp-2 mb-2">
                            {alert.headline}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                            <span>{alert.areaDesc}</span>
                            {alert.expires && (
                              <>
                                <span>•</span>
                                <span>Expires {formatDistanceToNow(new Date(alert.expires), { addSuffix: true })}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {unreadNotifications.length > 0 && <Separator />}
                </>
              )}

              {/* Regular Notifications */}
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

        {totalUnreadCount > 0 && (
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
