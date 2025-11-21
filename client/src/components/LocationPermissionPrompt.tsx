import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserLocation } from "@/contexts/LocationContext";

/**
 * Location Permission Prompt
 * Displays a friendly prompt asking users to enable location access
 * for personalized weather alerts
 */
export function LocationPermissionPrompt() {
  const { permissionStatus, requestLocation, cityState } = useUserLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt in this session
    const dismissed = sessionStorage.getItem("locationPromptDismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Use sessionStorage instead of localStorage so prompt shows again in new tabs
    sessionStorage.setItem("locationPromptDismissed", "true");
  };

  const handleAllowLocation = async () => {
    await requestLocation();
    // Dismiss after allowing
    setIsDismissed(true);
  };

  // Don't show if already granted, denied, unavailable, or dismissed
  if (
    permissionStatus === "granted" || 
    permissionStatus === "denied" || 
    permissionStatus === "unavailable" ||
    isDismissed ||
    cityState // Already have location
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-orange-500 dark:border-orange-400 bg-white dark:bg-gray-800 shadow-2xl">
        <div className="p-2.5 sm:p-3 md:p-6 relative">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            data-testid="button-dismiss-location-prompt"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          </button>

          <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 pr-4 sm:pr-6">
              <h3 className="font-semibold text-xs sm:text-sm md:text-lg text-black dark:text-white mb-1 sm:mb-2">
                Enable Location
              </h3>
              <p className="text-xs sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-4">
                Get accurate weather alerts for your area.
              </p>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Button
                  onClick={handleAllowLocation}
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold text-xs sm:text-sm"
                  data-testid="button-allow-location"
                >
                  Allow Access
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
