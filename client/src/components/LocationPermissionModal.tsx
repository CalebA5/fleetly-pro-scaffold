import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, Clock, Shield, AlertCircle } from "lucide-react";
import { useUserLocation } from "@/contexts/LocationContext";
import { useToast } from "@/hooks/use-toast";

interface LocationPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationPermissionModal({ open, onOpenChange }: LocationPermissionModalProps) {
  const { refreshLocation, markPrompted, markPermission } = useUserLocation();
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAllowLocation = async () => {
    setIsRequesting(true);
    setError(null);
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
      
      // Handle different error types
      if (error?.message === "PERMISSION_DENIED") {
        // Permission denied - mark as denied and close modal
        markPrompted();
        markPermission(false);
        onOpenChange(false);
        
        toast({
          title: "Location blocked by browser",
          description: "Click the lock icon 🔒 in your browser's address bar, change Location from 'Block' to 'Allow', then refresh the page.",
          variant: "destructive",
          duration: 8000,
        });
      } else if (error?.message === "TIMEOUT") {
        // Timeout - show error but keep modal open for retry
        setError("Location request timed out. Please try again.");
      } else if (error?.message === "POSITION_UNAVAILABLE") {
        // Position unavailable - show error but keep modal open for retry
        setError("Your location is currently unavailable. Please check your device settings and try again.");
      } else {
        // Unknown error - show generic message and keep modal open for retry
        setError("Could not get your location. Please try again.");
      }
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

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={handleAllowLocation}
            disabled={isRequesting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold h-10"
            data-testid="button-allow-location"
          >
            {isRequesting ? "Requesting..." : error ? "Try Again" : "Allow Location"}
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
