import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUserLocation } from "@/contexts/LocationContext";
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

interface SeenAlert {
  alertId: string;
  seenAt: number; // timestamp
}

const STORAGE_KEY = "fleetly_seen_weather_alerts";
const ALERT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get seen alerts from localStorage with expiry cleanup
 */
function getSeenAlerts(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    
    const seenAlerts: SeenAlert[] = JSON.parse(stored);
    const now = Date.now();
    
    // Filter out expired alerts (older than 24 hours)
    const validAlerts = seenAlerts.filter(
      alert => (now - alert.seenAt) < ALERT_TTL
    );
    
    // Update localStorage with cleaned list
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validAlerts));
    
    return new Set(validAlerts.map(a => a.alertId));
  } catch (error) {
    console.error("Failed to load seen alerts:", error);
    return new Set();
  }
}

/**
 * Mark an alert as seen in localStorage
 */
function markAlertAsSeen(alertId: string) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const seenAlerts: SeenAlert[] = stored ? JSON.parse(stored) : [];
    
    // Don't add duplicates
    if (!seenAlerts.some(a => a.alertId === alertId)) {
      seenAlerts.push({ alertId, seenAt: Date.now() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seenAlerts));
    }
  } catch (error) {
    console.error("Failed to save seen alert:", error);
  }
}

/**
 * Weather Alert Toast Notifications
 * Displays severe weather alerts as toast notifications that auto-dismiss
 * Persists seen alerts to localStorage to prevent repeat notifications
 */
export function WeatherAlertToast() {
  const { toast } = useToast();
  const { cityState, permissionStatus } = useUserLocation();
  const [seenAlerts, setSeenAlerts] = useState<Set<string>>(() => getSeenAlerts());

  // Delay alert fetching until location permission is handled
  const shouldFetchAlerts = permissionStatus !== "prompt";

  const { data: alerts } = useQuery<WeatherAlert[]>({
    queryKey: ['/api/weather/alerts/severe'],
    enabled: shouldFetchAlerts, // Only fetch if location permission has been handled
    refetchInterval: 4 * 60 * 60 * 1000, // Refetch every 4 hours
  });

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    // Refresh seen alerts from localStorage to apply TTL cleanup
    const currentSeenAlerts = getSeenAlerts();
    setSeenAlerts(currentSeenAlerts);

    // Filter alerts by user's location if available for maximum accuracy
    let relevantAlerts = alerts;
    if (cityState) {
      relevantAlerts = alerts.filter(alert => {
        // Check if the alert's area description includes the user's city or state
        const areaLower = alert.areaDesc.toLowerCase();
        const cityStateParts = cityState.split(", ");
        const userCity = cityStateParts[0]?.toLowerCase() || "";
        const userState = cityStateParts[1]?.toLowerCase() || "";
        
        return areaLower.includes(userCity) || areaLower.includes(userState);
      });
    }

    // Collect new alert IDs to prevent race conditions from multiple writes
    const newAlertIds: string[] = [];

    // Show toast for new alerts that haven't been shown yet
    relevantAlerts.forEach((alert) => {
      if (!currentSeenAlerts.has(alert.alertId)) {
        newAlertIds.push(alert.alertId);

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
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${severityColor}`} />
              <span className="font-semibold text-xs sm:text-sm truncate">{alert.event}</span>
            </div>
          ) as any,
          description: (
            <div className="space-y-1 sm:space-y-2 mt-1.5 sm:mt-2">
              <p className="text-xs sm:text-sm font-medium line-clamp-2">{alert.headline}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{alert.areaDesc}</p>
              <div className="flex gap-1.5 sm:gap-2 text-xs flex-wrap">
                <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                  alert.severity === "Extreme" 
                    ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                    : alert.severity === "Severe"
                    ? "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
                    : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                }`}>
                  {alert.severity}
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap">
                  {alert.urgency}
                </span>
              </div>
              {alert.instruction && (
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1.5 sm:mt-2 italic line-clamp-2">
                  {alert.instruction.substring(0, 100)}
                  {alert.instruction.length > 100 ? "..." : ""}
                </p>
              )}
            </div>
          ) as any,
          duration: 8000, // Auto-dismiss after 8 seconds
        });
      }
    });

    // Batch write all new alert IDs to localStorage to prevent race conditions
    if (newAlertIds.length > 0) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const seenAlerts: SeenAlert[] = stored ? JSON.parse(stored) : [];
        const now = Date.now();
        
        // Add all new alerts at once
        const newSeenAlerts: SeenAlert[] = newAlertIds.map(alertId => ({
          alertId,
          seenAt: now
        }));
        
        // Combine with existing, avoiding duplicates
        const combined = [...seenAlerts, ...newSeenAlerts];
        const unique = combined.filter((item, index, self) =>
          index === self.findIndex((t) => t.alertId === item.alertId)
        );
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
        
        // Update state with all new IDs
        setSeenAlerts(new Set([...currentSeenAlerts, ...newAlertIds]));
      } catch (error) {
        console.error("Failed to save seen alerts:", error);
      }
    }
  }, [alerts, toast, cityState]);

  return null; // This component doesn't render anything, just shows toasts
}
