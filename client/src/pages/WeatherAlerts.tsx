import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CloudSnow, Cloud, AlertTriangle, Calendar, MapPin, MapPinOff, Bell, Check, ChevronRight, Package } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useUserLocation } from "@/contexts/LocationContext";
import { useNotifications } from "@/hooks/useNotifications";

interface WeatherAlert {
  id: number;
  alertId: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
  areaDesc: string;
  effective: string;
  expires: string;
  instruction: string | null;
  category: string;
  isActive: number;
}

export function Notifications() {
  const { location, permissionStatus } = useUserLocation();
  const [locationDenied, setLocationDenied] = useState(false);
  const [, setLocation] = useLocation();
  const hasLocation = location !== null || permissionStatus === "granted";

  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "denied") {
          setLocationDenied(true);
        }
      });
    }
  }, []);

  const { data: alerts, isLoading: weatherLoading } = useQuery<WeatherAlert[]>({
    queryKey: ['/api/weather/alerts'],
    refetchInterval: 4 * 60 * 60 * 1000,
  });

  const {
    notifications,
    unreadNotifications,
    isLoading: notificationsLoading,
    markAsRead,
    isMarkingAsRead,
  } = useNotifications();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Extreme':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-500';
      case 'Severe':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-500';
      case 'Moderate':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-500';
      case 'Minor':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-500';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-500';
    }
  };

  const getAlertIcon = (event: string) => {
    const isWinterWeather = ["Winter Storm", "Snow", "Blizzard", "Ice"].some(
      term => event.includes(term)
    );
    const isStorm = ["Thunderstorm", "Storm", "Tornado", "High Wind"].some(
      term => event.includes(term)
    );

    if (isWinterWeather) return <CloudSnow className="w-5 h-5" />;
    if (isStorm) return <Cloud className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.readAt) {
      markAsRead(notification.notificationId);
    }

    if (notification.metadata?.actionUrl) {
      setLocation(notification.metadata.actionUrl);
    } else if (notification.requestId) {
      // Navigate based on audience role
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

  const isLoading = weatherLoading || notificationsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50 dark:from-gray-950 dark:via-orange-950/10 dark:to-gray-950">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts?.filter(a => a.isActive === 1) || [];
  const expiredAlerts = alerts?.filter(a => a.isActive === 0) || [];
  const totalAlerts = activeAlerts.length + unreadNotifications.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50 dark:from-gray-950 dark:via-orange-950/10 dark:to-gray-950 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent" data-testid="text-page-title">
                Alerts & Notifications
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Stay informed about weather conditions and service updates
              </p>
            </div>
            {totalAlerts > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-full">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-orange-900 dark:text-orange-100">{totalAlerts} Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Location Permission Prompt */}
        {(!hasLocation || locationDenied) && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <MapPinOff className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-black dark:text-white mb-1">Enable Location Services</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Get accurate weather alerts and improved operator matching for your area.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 shadow-md"
                    onClick={() => {
                      if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          () => {
                            setLocationDenied(false);
                            window.location.reload();
                          },
                          () => setLocationDenied(true)
                        );
                      }
                    }}
                    data-testid="button-enable-location-alerts"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Allow Location
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-white dark:bg-gray-900 shadow-sm">
            <TabsTrigger 
              value="notifications" 
              className="text-sm md:text-base data-[state=active]:bg-orange-100 dark:data-[state=active]:bg-orange-900/30 data-[state=active]:text-orange-900 dark:data-[state=active]:text-orange-100"
              data-testid="tab-notifications"
            >
              <Bell className="w-4 h-4 mr-2" />
              App Notifications
              {unreadNotifications.length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">{unreadNotifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="weather" 
              className="text-sm md:text-base data-[state=active]:bg-orange-100 dark:data-[state=active]:bg-orange-900/30 data-[state=active]:text-orange-900 dark:data-[state=active]:text-orange-100"
              data-testid="tab-weather"
            >
              <CloudSnow className="w-4 h-4 mr-2" />
              Weather Alerts
              {activeAlerts.length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">{activeAlerts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* App Notifications Tab */}
          <TabsContent value="notifications" className="space-y-3 animate-in fade-in-50 duration-200">
            {notifications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    You'll receive updates about your service requests, quotes, and job progress here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Unread Notifications */}
                {unreadNotifications.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                      Unread ({unreadNotifications.length})
                    </h2>
                    {unreadNotifications.map((notification) => (
                      <Card
                        key={notification.notificationId}
                        className="cursor-pointer hover:shadow-md transition-all duration-200 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900 hover:border-orange-300 dark:hover:border-orange-800"
                        onClick={() => handleNotificationClick(notification)}
                        data-testid={`notification-card-${notification.notificationId}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0 animate-pulse" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-1">
                                <h3 className="font-semibold text-sm text-orange-900 dark:text-orange-100">
                                  {notification.title}
                                </h3>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                {notification.body}
                              </p>
                              {notification.metadata?.serviceType && (
                                <Badge variant="secondary" className="text-xs">
                                  {notification.metadata.serviceType}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.notificationId);
                              }}
                              disabled={isMarkingAsRead}
                              className="hover:bg-orange-200 dark:hover:bg-orange-900/40"
                              data-testid={`button-mark-read-${notification.notificationId}`}
                            >
                              <Check className="h-4 w-4 text-orange-600" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Read Notifications */}
                {notifications.filter(n => n.readAt).length > 0 && (
                  <div className="space-y-3 mt-8">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                      Earlier
                    </h2>
                    {notifications.filter(n => n.readAt).map((notification) => (
                      <Card
                        key={notification.notificationId}
                        className="cursor-pointer hover:shadow-sm transition-all duration-200 opacity-75 hover:opacity-100"
                        onClick={() => handleNotificationClick(notification)}
                        data-testid={`notification-card-${notification.notificationId}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-1">
                                <h3 className="font-medium text-sm">{notification.title}</h3>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {notification.body}
                              </p>
                              {notification.metadata?.serviceType && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.metadata.serviceType}
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Weather Alerts Tab */}
          <TabsContent value="weather" className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Active Weather Alerts */}
            {activeAlerts.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Active Alerts ({activeAlerts.length})
                </h2>
                {activeAlerts.map((alert) => (
                  <Card 
                    key={alert.id} 
                    className={`border-l-4 hover:shadow-lg transition-all duration-200 ${getSeverityColor(alert.severity)}`}
                    data-testid={`alert-card-${alert.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)} flex-shrink-0`}>
                          {getAlertIcon(alert.event)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-base leading-tight" data-testid={`text-alert-event-${alert.id}`}>
                              {alert.event}
                            </h3>
                            <Badge variant="outline" className={`text-xs ${getSeverityColor(alert.severity)} flex-shrink-0 font-semibold`}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                            {alert.headline}
                          </p>
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{alert.areaDesc}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="whitespace-nowrap">Expires {format(new Date(alert.expires), "MMM d, h:mm a")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                    <CloudSnow className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" data-testid="text-no-alerts">All Clear</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    No active weather alerts in your area. We'll notify you when conditions change.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Expired Alerts */}
            {expiredAlerts.length > 0 && (
              <div className="mt-8 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  Recent History ({expiredAlerts.slice(0, 5).length})
                </h2>
                <div className="space-y-2 opacity-60">
                  {expiredAlerts.slice(0, 5).map((alert) => (
                    <Card key={alert.id} className="hover:opacity-100 transition-opacity" data-testid={`expired-alert-${alert.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 text-muted-foreground">
                              {getAlertIcon(alert.event)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{alert.event}</p>
                              <p className="text-xs text-muted-foreground truncate">{alert.areaDesc}</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                            <div className="font-medium">Expired</div>
                            <div>{format(new Date(alert.expires), "MMM d")}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
