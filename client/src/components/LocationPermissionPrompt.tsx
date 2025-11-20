import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "@/contexts/LocationContext";

/**
 * Location Permission Prompt
 * Displays a friendly prompt asking users to enable location access
 * for personalized weather alerts
 */
export function LocationPermissionPrompt() {
  const { permissionStatus, requestLocation, cityState } = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem("locationPromptDismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("locationPromptDismissed", "true");
  };

  const handleAllowLocation = async () => {
    await requestLocation();
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
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-orange-500 dark:border-orange-400 bg-white dark:bg-gray-800 shadow-2xl">
        <div className="p-4 md:p-6 relative">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            data-testid="button-dismiss-location-prompt"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 pr-6">
              <h3 className="font-semibold text-base md:text-lg text-black dark:text-white mb-2">
                Enable Location for Better Experience
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get weather alerts specific to your area and discover nearby operators faster.
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={handleAllowLocation}
                  className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold"
                  data-testid="button-allow-location"
                >
                  Allow Location Access
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                  You can change this in your browser settings anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
