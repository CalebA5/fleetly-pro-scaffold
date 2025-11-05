import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Image as ImageIcon,
  Snowflake,
  Car,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Ruler,
  Weight,
  Navigation
} from "lucide-react";
import type { ServiceRequest } from "@shared/schema";

interface ServiceRequestDetailsDialogProps {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceRequestDetailsDialog = ({ request, open, onOpenChange }: ServiceRequestDetailsDialogProps) => {
  if (!request) return null;

  const getServiceIcon = () => {
    switch (request.serviceType) {
      case "Snow Plowing":
      case "Ice Removal":
        return <Snowflake className="w-6 h-6" />;
      case "Towing":
      case "Roadside Assistance":
        return <Car className="w-6 h-6" />;
      case "Hauling":
        return <Truck className="w-6 h-6" />;
      case "Courier":
        return <Package className="w-6 h-6" />;
      default:
        return <Truck className="w-6 h-6" />;
    }
  };

  const getTimeFlexibilityLabel = (flexibility: string | null) => {
    if (!flexibility) return "Not specified";
    const labels: Record<string, string> = {
      asap: "ASAP - As soon as possible",
      exact: "Exact time - Must be on time",
      flexible: "Flexible - Within 1-2 hours",
      "very-flexible": "Very Flexible - Anytime today"
    };
    return labels[flexibility] || flexibility;
  };

  const details = request.details as any;
  const snowDetails = details?.type === 'snow' ? details.payload : null;
  const towingDetails = details?.type === 'towing' ? details.payload : null;
  const haulingDetails = details?.type === 'hauling' ? details.payload : null;
  const courierDetails = details?.type === 'courier' ? details.payload : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-request-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            {getServiceIcon()}
            <span>{request.serviceType} Request</span>
            {request.isEmergency === 1 && (
              <Badge className="bg-red-600 text-white" data-testid="badge-emergency">
                <AlertCircle className="w-3 h-3 mr-1" />
                EMERGENCY
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Request ID & Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Request ID</p>
              <p className="text-lg font-semibold text-black dark:text-white" data-testid="text-request-id">
                {request.requestId}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer</p>
              <p className="text-lg font-semibold text-black dark:text-white" data-testid="text-customer-name">
                {request.customerName}
              </p>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Service Location
            </p>
            <p className="text-base text-black dark:text-white" data-testid="text-location">
              {request.location}
            </p>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Job Description</p>
            <p className="text-base text-black dark:text-white whitespace-pre-wrap" data-testid="text-description">
              {request.description}
            </p>
          </div>

          <Separator />

          {/* Time & Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {request.preferredDate && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Preferred Date
                </p>
                <p className="text-base text-black dark:text-white" data-testid="text-preferred-date">
                  {request.preferredDate}
                </p>
              </div>
            )}
            {request.preferredTime && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  Preferred Time
                </p>
                <p className="text-base text-black dark:text-white" data-testid="text-preferred-time">
                  {request.preferredTime}
                </p>
              </div>
            )}
          </div>

          {request.timeFlexibility && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Time Flexibility</p>
              <p className="text-base text-black dark:text-white" data-testid="text-time-flexibility">
                {getTimeFlexibilityLabel(request.timeFlexibility)}
              </p>
            </div>
          )}

          {/* Budget */}
          {request.budgetRange && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                Budget Range
              </p>
              <p className="text-lg font-semibold text-green-600" data-testid="text-budget">
                {request.budgetRange}
              </p>
            </div>
          )}

          {/* Photos */}
          {request.imageCount > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4" />
                Photos Attached
              </p>
              <p className="text-base text-black dark:text-white" data-testid="text-image-count">
                {request.imageCount} photo{request.imageCount > 1 ? 's' : ''} uploaded
              </p>
            </div>
          )}

          <Separator />

          {/* Service-Specific Details */}
          {snowDetails && (
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                <Snowflake className="w-5 h-5" />
                Snow Plowing Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {snowDetails.areaSize && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Area Size</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-snow-area">
                      {snowDetails.areaSize}
                    </p>
                  </div>
                )}
                {snowDetails.surfaceType && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Surface Type</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-snow-surface">
                      {snowDetails.surfaceType}
                    </p>
                  </div>
                )}
                {snowDetails.snowDepth && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Snow Depth</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-snow-depth">
                      {snowDetails.snowDepth}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Obstacles Present</p>
                  <p className="text-base text-black dark:text-white flex items-center gap-2" data-testid="text-snow-obstacles">
                    {snowDetails.hasObstacles ? (
                      <><CheckCircle className="w-4 h-4 text-yellow-600" /> Yes</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-gray-400" /> No</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Salting Required</p>
                  <p className="text-base text-black dark:text-white flex items-center gap-2" data-testid="text-snow-salting">
                    {snowDetails.needsSalting ? (
                      <><CheckCircle className="w-4 h-4 text-blue-600" /> Yes</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-gray-400" /> No</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {towingDetails && (
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Towing Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {towingDetails.vehicleType && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Type</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-tow-vehicle-type">
                      {towingDetails.vehicleType}
                    </p>
                  </div>
                )}
                {towingDetails.vehicleCondition && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Condition</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-tow-condition">
                      {towingDetails.vehicleCondition}
                    </p>
                  </div>
                )}
                {towingDetails.vehicleMake && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Make</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-tow-make">
                      {towingDetails.vehicleMake}
                    </p>
                  </div>
                )}
                {towingDetails.vehicleModel && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-tow-model">
                      {towingDetails.vehicleModel}
                    </p>
                  </div>
                )}
                {towingDetails.destination && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Destination
                    </p>
                    <p className="text-base text-black dark:text-white" data-testid="text-tow-destination">
                      {towingDetails.destination}
                    </p>
                  </div>
                )}
                {towingDetails.reason && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason for Towing</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-tow-reason">
                      {towingDetails.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {haulingDetails && (
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Hauling Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {haulingDetails.itemType && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Item Type</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-haul-item-type">
                      {haulingDetails.itemType}
                    </p>
                  </div>
                )}
                {haulingDetails.numberOfItems && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Number of Items</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-haul-count">
                      {haulingDetails.numberOfItems}
                    </p>
                  </div>
                )}
                {haulingDetails.weight && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Weight className="w-4 h-4" />
                      Weight
                    </p>
                    <p className="text-base text-black dark:text-white" data-testid="text-haul-weight">
                      {haulingDetails.weight}
                    </p>
                  </div>
                )}
                {haulingDetails.dimensions && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Dimensions
                    </p>
                    <p className="text-base text-black dark:text-white" data-testid="text-haul-dimensions">
                      {haulingDetails.dimensions}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading Help Needed</p>
                  <p className="text-base text-black dark:text-white flex items-center gap-2" data-testid="text-haul-loading">
                    {haulingDetails.needsLoadingHelp ? (
                      <><CheckCircle className="w-4 h-4 text-blue-600" /> Yes</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-gray-400" /> No</>
                    )}
                  </p>
                </div>
                {haulingDetails.disposalLocation && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Disposal Location</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-haul-disposal">
                      {haulingDetails.disposalLocation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {courierDetails && (
            <div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Courier Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courierDetails.packageSize && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Package Size</p>
                    <p className="text-base text-black dark:text-white" data-testid="text-courier-size">
                      {courierDetails.packageSize}
                    </p>
                  </div>
                )}
                {courierDetails.packageWeight && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Weight className="w-4 h-4" />
                      Package Weight
                    </p>
                    <p className="text-base text-black dark:text-white" data-testid="text-courier-weight">
                      {courierDetails.packageWeight}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fragile</p>
                  <p className="text-base text-black dark:text-white flex items-center gap-2" data-testid="text-courier-fragile">
                    {courierDetails.isFragile ? (
                      <><AlertCircle className="w-4 h-4 text-orange-600" /> Yes - Handle with care</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-gray-400" /> No</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Signature Required</p>
                  <p className="text-base text-black dark:text-white flex items-center gap-2" data-testid="text-courier-signature">
                    {courierDetails.requiresSignature ? (
                      <><CheckCircle className="w-4 h-4 text-blue-600" /> Yes</>
                    ) : (
                      <><XCircle className="w-4 h-4 text-gray-400" /> No</>
                    )}
                  </p>
                </div>
                {courierDetails.destination && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Delivery Address
                    </p>
                    <p className="text-base text-black dark:text-white" data-testid="text-courier-destination">
                      {courierDetails.destination}
                    </p>
                  </div>
                )}
                {courierDetails.deliveryInstructions && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Instructions</p>
                    <p className="text-base text-black dark:text-white whitespace-pre-wrap" data-testid="text-courier-instructions">
                      {courierDetails.deliveryInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
