/**
 * Weather Service - National Weather Service (NWS) API Integration
 * Provides free, unlimited weather alerts for the United States
 * API Documentation: https://www.weather.gov/documentation/services-web-api
 */

export interface WeatherAlert {
  id: string;
  event: string; // e.g., "Winter Storm Warning", "Heavy Snow Watch"
  headline: string;
  description: string;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  certainty: "Observed" | "Likely" | "Possible" | "Unlikely" | "Unknown";
  urgency: "Immediate" | "Expected" | "Future" | "Past" | "Unknown";
  areaDesc: string;
  effective: string;
  expires: string;
  status: "Actual" | "Exercise" | "System" | "Test" | "Draft";
  messageType: "Alert" | "Update" | "Cancel";
  category: "Met" | "Geo" | "Safety" | "Security" | "Rescue" | "Fire" | "Health" | "Env" | "Transport" | "Infra" | "CBRNE" | "Other";
  instruction?: string;
}

export interface NWSResponse {
  features: Array<{
    id: string;
    properties: WeatherAlert;
  }>;
}

/**
 * Fetch active weather alerts for a specific state or area
 * @param area - Two-letter state code (e.g., "CO", "NY") or "US" for all alerts
 * @returns Array of active weather alerts
 */
export async function getWeatherAlerts(area: string = "US"): Promise<WeatherAlert[]> {
  try {
    const url = `https://api.weather.gov/alerts/active${area !== "US" ? `?area=${area}` : ""}`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Fleetly/1.0 (contact@fleetly.app)", // NWS requires a User-Agent
        "Accept": "application/geo+json"
      }
    });

    if (!response.ok) {
      throw new Error(`NWS API error: ${response.status} ${response.statusText}`);
    }

    const data: NWSResponse = await response.json();
    
    return data.features.map(feature => feature.properties);
  } catch (error) {
    console.error("Error fetching weather alerts:", error);
    return [];
  }
}

/**
 * Check if alerts contain severe winter weather
 * @param alerts - Array of weather alerts
 * @returns Array of winter weather alerts
 */
export function filterWinterWeatherAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
  const winterKeywords = [
    "snow",
    "winter storm",
    "blizzard",
    "ice storm",
    "freezing",
    "winter weather",
    "heavy snow"
  ];

  return alerts.filter(alert => {
    const eventLower = alert.event.toLowerCase();
    return winterKeywords.some(keyword => eventLower.includes(keyword));
  });
}

/**
 * Check if alerts contain severe storms
 * @param alerts - Array of weather alerts
 * @returns Array of storm alerts
 */
export function filterStormAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
  const stormKeywords = [
    "storm",
    "thunderstorm",
    "severe weather",
    "tornado",
    "hurricane",
    "high wind",
    "flood"
  ];

  return alerts.filter(alert => {
    const eventLower = alert.event.toLowerCase();
    return stormKeywords.some(keyword => eventLower.includes(keyword));
  });
}

/**
 * Get relevant alerts for snow plowing, towing, and hauling services
 * @param area - State code or "US"
 * @returns Object with winter and storm alerts
 */
export async function getServiceRelevantAlerts(area: string = "US") {
  const allAlerts = await getWeatherAlerts(area);
  
  return {
    winterAlerts: filterWinterWeatherAlerts(allAlerts),
    stormAlerts: filterStormAlerts(allAlerts),
    allAlerts: allAlerts.filter(alert => 
      alert.severity === "Extreme" || 
      alert.severity === "Severe"
    )
  };
}
