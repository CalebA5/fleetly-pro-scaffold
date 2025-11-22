import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, Star } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  status: "online" | "busy" | "offline";
  currentJobs: number;
  maxCapacity: number;
  rating: number;
  preferredServices: string[];
}

interface DriverAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDriver: (driverId: string) => void;
  drivers: Driver[];
  requestDetails?: {
    customerName: string;
    serviceType: string;
    location: string;
  };
}

export function DriverAssignmentModal({
  isOpen,
  onClose,
  onSelectDriver,
  drivers,
  requestDetails
}: DriverAssignmentModalProps) {
  
  const availableDrivers = drivers.filter(d => d.status !== "offline" && d.currentJobs < d.maxCapacity);
  
  // Sort by rating (best first) and availability
  const sortedDrivers = [...availableDrivers].sort((a, b) => {
    if (a.status === "online" && b.status !== "online") return -1;
    if (b.status === "online" && a.status !== "online") return 1;
    return b.rating - a.rating;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Assign Driver to Job</DialogTitle>
          <DialogDescription>
            {requestDetails && (
              <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="font-semibold text-black dark:text-white">{requestDetails.customerName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{requestDetails.serviceType} • {requestDetails.location}</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {sortedDrivers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No drivers available. All drivers are offline or at capacity.</p>
            </div>
          ) : (
            sortedDrivers.map((driver) => (
              <div
                key={driver.id}
                className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-500 dark:hover:border-purple-400 transition-all cursor-pointer"
                onClick={() => {
                  onSelectDriver(driver.id);
                  onClose();
                }}
                data-testid={`driver-option-${driver.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      driver.status === "online" 
                        ? "bg-green-100 dark:bg-green-900" 
                        : "bg-orange-100 dark:bg-orange-900"
                    }`}>
                      <Users className={`w-6 h-6 ${
                        driver.status === "online"
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black dark:text-white">{driver.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                          <span className="text-sm font-semibold text-black dark:text-white">{driver.rating}</span>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">•</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{driver.preferredServices.join(", ")}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={
                          driver.status === "online" 
                            ? "bg-green-600 text-white text-xs" 
                            : "bg-orange-600 text-white text-xs"
                        }>
                          {driver.status === "online" ? "AVAILABLE" : `BUSY (${driver.currentJobs}/${driver.maxCapacity})`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            data-testid="button-cancel-driver-assignment"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
