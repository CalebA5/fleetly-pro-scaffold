import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/contexts/LocationContext";
import { CloudSnow, Cloud, AlertTriangle } from "lucide-react";

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

/**
 * Weather Alert Toast Notifications
 * Displays severe weather alerts as toast notifications that auto-dismiss
 */
export function WeatherAlertToast() {
  const { toast } = useToast();
  const { cityState } = useLocation();
  const shownAlerts = useRef<Set<string>>(new Set());

  const { data: alerts } = useQuery<WeatherAlert[]>({
    queryKey: ['/api/weather/alerts/severe'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    // Filter alerts by user's location if available
    let relevantAlerts = alerts;
    if (cityState) {
      relevantAlerts = alerts.filter(alert => {
        // Check if the alert's area description includes the user's city or state
        const areaLower = alert.areaDesc.toLowerCase();
        const [userCity, userState] = cityState.split(", ");
        return areaLower.includes(userCity.toLowerCase()) || 
               areaLower.includes(userState.toLowerCase());
      });
    }

    // Show toast for new alerts that haven't been shown yet
    relevantAlerts.forEach((alert) => {
      if (!shownAlerts.current.has(alert.alertId)) {
        shownAlerts.current.add(alert.alertId);

        const isWinterWeather = ["Winter Storm", "Snow", "Blizzard", "Ice"].some(
          term => alert.event.includes(term)
        );
        const isStorm = ["Thunderstorm", "Storm", "Tornado", "High Wind"].some(
          term => alert.event.includes(term)
        );

        const Icon = isWinterWeather ? CloudSnow : isStorm ? Cloud : AlertTriangle;
        
        const severityColor = alert.severity === "Extreme" 
          ? "text-red-600 dark:text-red-400"
          : alert.severity === "Severe"
          ? "text-orange-600 dark:text-orange-400"
          : "text-yellow-600 dark:text-yellow-400";

        toast({
          title: (
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${severityColor}`} />
              <span className="font-semibold">{alert.event}</span>
            </div>
          ) as any,
          description: (
            <div className="space-y-2 mt-2">
              <p className="text-sm font-medium">{alert.headline}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{alert.areaDesc}</p>
              <div className="flex gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded ${
                  alert.severity === "Extreme" 
                    ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                    : alert.severity === "Severe"
                    ? "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
                    : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                }`}>
                  {alert.severity}
                </span>
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                  {alert.urgency}
                </span>
              </div>
              {alert.instruction && (
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 italic">
                  {alert.instruction.substring(0, 150)}
                  {alert.instruction.length > 150 ? "..." : ""}
                </p>
              )}
            </div>
          ) as any,
          duration: 10000, // Auto-dismiss after 10 seconds
        });
      }
    });

    // Clean up shown alerts that have expired
    const currentAlertIds = new Set(alerts.map(a => a.alertId));
    shownAlerts.current.forEach(alertId => {
      if (!currentAlertIds.has(alertId)) {
        shownAlerts.current.delete(alertId);
      }
    });
  }, [alerts, toast, cityState]);

  return null; // This component doesn't render anything, just shows toasts
}
