import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, Clock, Shield } from "lucide-react";
import { useUserLocation } from "@/contexts/LocationContext";

interface LocationPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationPermissionModal({ open, onOpenChange }: LocationPermissionModalProps) {
  const { setFormattedAddress } = useUserLocation();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllowLocation = async () => {
    setIsRequesting(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      // Reverse geocode to get human-readable address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=16&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Fleetly-Location-App'
            }
          }
        );
        const data = await response.json();
        
        if (data.address) {
          const address = data.address;
          const formattedAddr = [
            address.road,
            address.city || address.town || address.village,
            address.state
          ].filter(Boolean).join(", ");
          
          setFormattedAddress(
            formattedAddr || data.display_name,
            position.coords.latitude,
            position.coords.longitude
          );
        } else {
          // Fallback to coordinates if reverse geocoding fails
          const coordAddr = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          setFormattedAddress(coordAddr, position.coords.latitude, position.coords.longitude);
        }
      } catch (geocodeError) {
        console.error("Reverse geocoding error:", geocodeError);
        // Fallback to coordinates
        const coordAddr = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        setFormattedAddress(coordAddr, position.coords.latitude, position.coords.longitude);
      }

      // Mark that user has been prompted
      localStorage.setItem('fleetly_location_prompted', 'true');
      localStorage.setItem('fleetly_location_granted', 'true');
      
      onOpenChange(false);
    } catch (error) {
      console.error("Location error:", error);
      // Still mark as prompted even if denied
      localStorage.setItem('fleetly_location_prompted', 'true');
      localStorage.setItem('fleetly_location_granted', 'false');
      onOpenChange(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('fleetly_location_prompted', 'true');
    localStorage.setItem('fleetly_location_granted', 'false');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-location-permission">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Enable Location Access
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Get the best experience with Fleetly by sharing your location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-black dark:text-white">
                  Find Nearby Operators
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  See available operators in your area instantly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-black dark:text-white">
                  Faster Service
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Skip manual address entry and get help quicker
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-black dark:text-white">
                  Emergency Support
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Get immediate help in urgent situations with SOS mode
                </p>
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-500 px-4">
            We only use your location to find nearby operators. Your privacy is protected.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleAllowLocation}
            disabled={isRequesting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
            data-testid="button-allow-location"
          >
            {isRequesting ? "Requesting Location..." : "Allow Location Access"}
          </Button>
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-gray-600 dark:text-gray-400"
            data-testid="button-skip-location"
          >
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
