import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserLocation } from "@/contexts/LocationContext";
import { useI18n } from "@/i18n";
import { formatDistanceToNow } from "date-fns";
import { Bell, CloudSnow, AlertTriangle, CheckCheck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, unreadNotifications, markAsRead } = useNotifications();
  const { location: userLocation } = useUserLocation();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

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
    
    return distance <= 50;
  });

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.notificationId);

    if (notification.metadata?.actionUrl) {
      setLocation(notification.metadata.actionUrl);
    } else if (notification.requestId) {
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
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t.nav.notifications}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t.notifications.stayUpdated}
            </p>
          </div>
          
          {unreadNotifications.length > 0 && (
            <Button 
              onClick={() => {
                unreadNotifications.forEach(n => markAsRead(n.notificationId));
              }}
              variant="outline"
              size="sm"
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all" data-testid="tab-all">
              All
              {(unreadNotifications.length + localWeatherAlerts.length) > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">
                  {unreadNotifications.length + localWeatherAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              Notifications
              {unreadNotifications.length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="weather" data-testid="tab-weather">
              Weather Alerts
              {localWeatherAlerts.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">
                  {localWeatherAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-4">
            {localWeatherAlerts.length === 0 && notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No notifications or alerts
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You're all caught up!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Weather Alerts */}
                {localWeatherAlerts.map((alert) => (
                  <Card 
                    key={alert.id}
                    className="border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20"
                    data-testid={`weather-alert-${alert.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
                          {alert.event?.includes('Winter') || alert.event?.includes('Snow') ? (
                            <CloudSnow className="w-6 h-6 text-red-600 dark:text-red-400" />
                          ) : (
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-red-900 dark:text-red-100">
                              {alert.event}
                            </CardTitle>
                            <Badge variant="destructive">{alert.severity}</Badge>
                          </div>
                          <CardDescription className="text-red-700 dark:text-red-300">
                            {alert.headline}
                          </CardDescription>
                          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
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
                    </CardHeader>
                  </Card>
                ))}

                {/* Regular Notifications */}
                {notifications.map((notification) => (
                  <Card
                    key={notification.notificationId}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      notification.readAt ? 'opacity-60' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.notificationId}`}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/50">
                          <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-gray-900 dark:text-white">
                              {notification.title}
                            </CardTitle>
                            {!notification.readAt && (
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                            )}
                          </div>
                          <CardDescription>{notification.body}</CardDescription>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* Notifications Only Tab */}
          <TabsContent value="notifications" className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No notifications
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    When you receive notifications, they'll appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.notificationId}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    notification.readAt ? 'opacity-60' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-${notification.notificationId}`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/50">
                        <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-gray-900 dark:text-white">
                            {notification.title}
                          </CardTitle>
                          {!notification.readAt && (
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                          )}
                        </div>
                        <CardDescription>{notification.body}</CardDescription>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Weather Alerts Only Tab */}
          <TabsContent value="weather" className="space-y-4">
            {localWeatherAlerts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CloudSnow className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No weather alerts
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We'll notify you of any severe weather in your area
                  </p>
                </CardContent>
              </Card>
            ) : (
              localWeatherAlerts.map((alert) => (
                <Card 
                  key={alert.id}
                  className="border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20"
                  data-testid={`weather-alert-${alert.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
                        {alert.event?.includes('Winter') || alert.event?.includes('Snow') ? (
                          <CloudSnow className="w-6 h-6 text-red-600 dark:text-red-400" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-red-900 dark:text-red-100">
                            {alert.event}
                          </CardTitle>
                          <Badge variant="destructive">{alert.severity}</Badge>
                        </div>
                        <CardDescription className="text-red-700 dark:text-red-300">
                          {alert.headline}
                        </CardDescription>
                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
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
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MobileBottomNav />
    </div>
  );
}
