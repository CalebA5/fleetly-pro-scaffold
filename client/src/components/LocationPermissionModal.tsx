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
  const { refreshLocation, markPrompted, markPermission } = useUserLocation();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllowLocation = async () => {
    setIsRequesting(true);
    try {
      // Use centralized refreshLocation from context
      await refreshLocation();
      
      // Mark that user has been prompted and granted permission
      markPrompted();
      markPermission(true);
      
      // Close modal on success
      onOpenChange(false);
    } catch (error: any) {
      console.error("Location error:", error);
      
      // Mark as prompted
      markPrompted();
      
      // Only mark as denied if permission was actually denied
      if (error?.message === "PERMISSION_DENIED") {
        markPermission(false);
      }
      // For other errors (timeout, position unavailable), don't change permission status
      
      onOpenChange(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    markPrompted();
    markPermission(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] max-h-[85vh] overflow-y-auto" data-testid="modal-location-permission">
        <DialogHeader className="space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">
            Enable Location
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Find nearby operators faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 py-3">
          {/* Benefits - Compact Version */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs text-black dark:text-white">
                  Find Nearby Operators
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                  See available operators instantly
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs text-black dark:text-white">
                  Faster Service
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                  Skip manual address entry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs text-black dark:text-white">
                  Emergency Support
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                  Quick SOS mode access
                </p>
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-500 px-2">
            Your privacy is protected
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={handleAllowLocation}
            disabled={isRequesting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold h-10"
            data-testid="button-allow-location"
          >
            {isRequesting ? "Requesting..." : "Allow Location"}
          </Button>
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-gray-600 dark:text-gray-400 h-9"
            data-testid="button-skip-location"
          >
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
