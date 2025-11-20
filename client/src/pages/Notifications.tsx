import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CloudSnow, Cloud, AlertTriangle, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

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
  const { data: alerts, isLoading } = useQuery<WeatherAlert[]>({
    queryKey: ['/api/weather/alerts'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent" data-testid="text-page-title">
                Weather Alerts
              </h1>
              <p className="text-muted-foreground">Service-relevant weather notifications</p>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" data-testid="text-active-alerts-title">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Active Alerts ({activeAlerts.length})
            </h2>
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`border-l-4 ${getSeverityColor(alert.severity)}`}
                  data-testid={`alert-card-${alert.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                          {getAlertIcon(alert.event)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2" data-testid={`text-alert-event-${alert.id}`}>
                            {alert.event}
                          </CardTitle>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            {alert.headline}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                              {alert.urgency}
                            </Badge>
                            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                              {alert.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{alert.areaDesc}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Description:</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {alert.description}
                        </p>
                      </div>
                      
                      {alert.instruction && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            Instructions:
                          </h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {alert.instruction}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Effective: {format(new Date(alert.effective), "MMM d, h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Expires: {format(new Date(alert.expires), "MMM d, h:mm a")}</span>
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

        {/* Expired Alerts (Recent History) */}
        {expiredAlerts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-600 dark:text-gray-400" data-testid="text-expired-alerts-title">
              Recent Expired Alerts ({expiredAlerts.length})
            </h2>
            <div className="space-y-4 opacity-60">
              {expiredAlerts.slice(0, 10).map((alert) => (
                <Card key={alert.id} className="border-gray-300 dark:border-gray-700" data-testid={`expired-alert-${alert.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getAlertIcon(alert.event)}
                        <CardTitle className="text-base">{alert.event}</CardTitle>
                      </div>
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                        Expired
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {alert.areaDesc}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Expired: {format(new Date(alert.expires), "MMM d, h:mm a")}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
