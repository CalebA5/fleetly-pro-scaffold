import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CloudSnow, Cloud, AlertTriangle, Calendar, MapPin, MapPinOff } from "lucide-react";
import { format } from "date-fns";
import { useUserLocation } from "@/contexts/LocationContext";

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

  const { data: alerts, isLoading } = useQuery<WeatherAlert[]>({
    queryKey: ['/api/weather/alerts'],
    refetchInterval: 4 * 60 * 60 * 1000, // Refresh every 4 hours
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts?.filter(a => a.isActive === 1) || [];
  const expiredAlerts = alerts?.filter(a => a.isActive === 0) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-3 md:mb-4" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent" data-testid="text-page-title">
              Weather Alerts
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Service-relevant weather notifications for your area</p>
          </div>
        </div>

        {/* Location Permission Prompt */}
        {(!hasLocation || locationDenied) && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <MapPinOff className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-black dark:text-white mb-1">Enable Location Services</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    To get accurate weather alerts for your area and improve operator matching, please enable location access.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                    onClick={() => {
                      if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          () => {
                            setLocationDenied(false);
                            window.location.reload();
                          },
                          () => {
                            setLocationDenied(true);
                          }
                        );
                      }
                    }}
                    data-testid="button-enable-location-alerts"
                  >
                    Allow Location
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Alerts - Compact List */}
        {activeAlerts.length > 0 && (
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 flex items-center gap-2" data-testid="text-active-alerts-title">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              Active Alerts ({activeAlerts.length})
            </h2>
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`border-l-4 hover:shadow-md transition-shadow ${getSeverityColor(alert.severity)}`}
                  data-testid={`alert-card-${alert.id}`}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className={`p-1 md:p-1.5 rounded-full ${getSeverityColor(alert.severity)} flex-shrink-0`}>
                        {getAlertIcon(alert.event)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-sm md:text-base leading-tight" data-testid={`text-alert-event-${alert.id}`}>
                            {alert.event}
                          </h3>
                          <Badge variant="outline" className={`text-xs ${getSeverityColor(alert.severity)} flex-shrink-0`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-1.5 md:mb-2">
                          {alert.headline}
                        </p>
                        <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{alert.areaDesc}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span className="whitespace-nowrap">Expires {format(new Date(alert.expires), "MMM d, h:mm a")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Active Alerts */}
        {activeAlerts.length === 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6 text-center">
              <CloudSnow className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-alerts">No Active Weather Alerts</h3>
              <p className="text-sm text-muted-foreground">
                You'll be notified when severe weather is detected in your area
              </p>
            </CardContent>
          </Card>
        )}

        {/* Expired Alerts (Recent History) - Compact */}
        {expiredAlerts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-600 dark:text-gray-400" data-testid="text-expired-alerts-title">
              Recent Expired Alerts ({expiredAlerts.length})
            </h2>
            <div className="space-y-2 opacity-60">
              {expiredAlerts.slice(0, 10).map((alert) => (
                <Card key={alert.id} className="border-gray-300 dark:border-gray-700" data-testid={`expired-alert-${alert.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getAlertIcon(alert.event)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{alert.event}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{alert.areaDesc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-xs text-gray-500 dark:text-gray-500 text-right">
                          <div>Expired</div>
                          <div>{format(new Date(alert.expires), "MMM d")}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
