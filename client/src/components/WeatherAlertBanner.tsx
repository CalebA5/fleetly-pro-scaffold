import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, CloudSnow, Cloud, AlertTriangle } from "lucide-react";
import type { WeatherAlert } from "@shared/schema";

export const WeatherAlertBanner = () => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Fetch severe weather alerts from the API
  const { data: alerts = [], isLoading } = useQuery<WeatherAlert[]>({
    queryKey: ['/api/weather/alerts/severe'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Filter out dismissed alerts
  const activeAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.alertId));

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    localStorage.setItem('dismissedAlerts', JSON.stringify([...dismissedAlerts, alertId]));
  };

  // Load dismissed alerts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dismissedAlerts');
    if (stored) {
      try {
        setDismissedAlerts(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse dismissed alerts:', e);
      }
    }
  }, []);

  // Clear expired dismissed alerts
  useEffect(() => {
    if (alerts.length > 0) {
      const activeAlertIds = new Set(alerts.map(a => a.alertId));
      const updatedDismissed = dismissedAlerts.filter(id => activeAlertIds.has(id));
      
      if (updatedDismissed.length !== dismissedAlerts.length) {
        setDismissedAlerts(updatedDismissed);
        localStorage.setItem('dismissedAlerts', JSON.stringify(updatedDismissed));
      }
    }
  }, [alerts]);

  const getAlertIcon = (event: string) => {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('snow') || eventLower.includes('winter') || eventLower.includes('blizzard')) {
      return <CloudSnow className="w-5 h-5" />;
    }
    if (eventLower.includes('storm') || eventLower.includes('thunder')) {
      return <Cloud className="w-5 h-5" />;
    }
    return <AlertTriangle className="w-5 h-5" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'severe':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      case 'moderate':
        return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  if (isLoading || activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900">
      {activeAlerts.map((alert) => (
        <Alert 
          key={alert.alertId}
          className={`relative border-l-4 ${
            alert.severity === 'Extreme' ? 'border-l-red-600' :
            alert.severity === 'Severe' ? 'border-l-orange-600' :
            'border-l-yellow-500'
          }`}
          data-testid={`weather-alert-${alert.alertId}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.event)}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <AlertTitle className="font-bold text-lg">
                  {alert.event}
                </AlertTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => dismissAlert(alert.alertId)}
                  aria-label="Dismiss alert"
                  data-testid={`button-dismiss-${alert.alertId}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge className={getSeverityColor(alert.severity)}>
                  {alert.severity}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {alert.urgency}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {alert.areaDesc}
                </Badge>
              </div>

              <AlertDescription className="text-sm">
                <p className="font-semibold mb-1">{alert.headline}</p>
                {alert.instruction && (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Instructions:</strong> {alert.instruction}
                  </p>
                )}
              </AlertDescription>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>Effective: {new Date(alert.effective).toLocaleString()}</p>
                <p>Expires: {new Date(alert.expires).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Alert>
      ))}
      
      {activeAlerts.length > 0 && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ⚠️ <strong>{activeAlerts.length}</strong> severe weather {activeAlerts.length === 1 ? 'alert' : 'alerts'} in your area. 
            Service requests may experience delays.
          </p>
        </div>
      )}
    </div>
  );
};
