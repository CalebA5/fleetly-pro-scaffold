import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Truck, CheckCircle } from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  type: string;
  status: "available" | "busy" | "maintenance";
  currentJobs: number;
  maxCapacity: number;
}

interface VehicleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicleId: string) => void;
  vehicles: Vehicle[];
  requestDetails?: {
    customerName: string;
    serviceType: string;
    location: string;
  };
}

export function VehicleSelectionModal({
  isOpen,
  onClose,
  onSelectVehicle,
  vehicles,
  requestDetails
}: VehicleSelectionModalProps) {
  
  const availableVehicles = vehicles.filter(v => v.status === "available" || (v.status === "busy" && v.currentJobs < v.maxCapacity));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Assign Vehicle to Job</DialogTitle>
          <DialogDescription>
            {requestDetails && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="font-semibold text-black dark:text-white">{requestDetails.customerName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{requestDetails.serviceType} • {requestDetails.location}</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {availableVehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No vehicles available. All vehicles are at capacity or in maintenance.</p>
            </div>
          ) : (
            availableVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer"
                onClick={() => {
                  onSelectVehicle(vehicle.id);
                  onClose();
                }}
                data-testid={`vehicle-option-${vehicle.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      vehicle.status === "available" 
                        ? "bg-green-100 dark:bg-green-900" 
                        : "bg-orange-100 dark:bg-orange-900"
                    }`}>
                      <Truck className={`w-6 h-6 ${
                        vehicle.status === "available"
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-black dark:text-white">{vehicle.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{vehicle.type}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={
                          vehicle.status === "available" 
                            ? "bg-green-600 text-white text-xs" 
                            : "bg-orange-600 text-white text-xs"
                        }>
                          {vehicle.status === "available" ? "AVAILABLE" : `BUSY (${vehicle.currentJobs}/${vehicle.maxCapacity})`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-blue-600" />
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
            data-testid="button-cancel-vehicle-selection"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
