import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  User, 
  Calendar,
  Image as ImageIcon,
  FileText,
  CheckCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface RequestDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  operatorId: string;
  onQuote: (request: any) => void;
  onDecline: (request: any) => void;
}

export function RequestDetailsModal({
  open,
  onOpenChange,
  request,
  operatorId,
  onQuote,
  onDecline
}: RequestDetailsModalProps) {
  if (!request) return null;

  const isEmergency = request.isEmergency === 1 || request.isEmergency === true;
  const details = request.details || {};

  // Fetch quotes for this service request - use requestId or fallback to id
  const serviceRequestId = request.requestId || request.id;
  const { data: quotes = [] } = useQuery<any[]>({
    queryKey: [`/api/quotes/service-request/${serviceRequestId}`],
    enabled: open && !!serviceRequestId,
  });

  // Check if current operator has already quoted
  const existingQuote = quotes.find(q => q.operatorId === operatorId && q.status !== 'operator_withdrawn');
  const hasQuoted = !!existingQuote;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {request.serviceType}
                {isEmergency && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    EMERGENCY
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1 text-gray-600 dark:text-gray-400">
                Request ID: {request.requestId}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Information
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>{" "}
                <span className="text-gray-900 dark:text-white">{request.customerName}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Request Time:</span>{" "}
                <span className="text-gray-900 dark:text-white">
                  {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                </span>
              </p>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-900 dark:text-white">{request.location}</p>
              {request.latitude && request.longitude && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Coordinates: {request.latitude}, {request.longitude}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Job Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Job Description
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {request.description}
              </p>
            </div>
          </div>

          <Separator />

          {/* Schedule & Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Schedule
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-1">
                {request.preferredDate && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>{" "}
                    <span className="text-gray-900 dark:text-white">{request.preferredDate}</span>
                  </p>
                )}
                {request.preferredTime && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Time:</span>{" "}
                    <span className="text-gray-900 dark:text-white">{request.preferredTime}</span>
                  </p>
                )}
                {request.timeFlexibility && (
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Flexibility:</span>{" "}
                    <span className="text-gray-900 dark:text-white">{request.timeFlexibility}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Budget
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {request.budgetRange || "Not specified"}
                </p>
                {request.estimatedCost && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Estimated: ${request.estimatedCost}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Service-Specific Details */}
          {Object.keys(details).length > 0 && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Service-Specific Details
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  {Object.entries(details).map(([key, value]) => {
                    if (typeof value === 'object' || value === null) return null;
                    return (
                      <p key={key} className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>{" "}
                        <span className="text-gray-900 dark:text-white">
                          {String(value)}
                        </span>
                      </p>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Photos */}
          {request.imageCount > 0 && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Photos ({request.imageCount})
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customer has uploaded {request.imageCount} photo{request.imageCount > 1 ? 's' : ''} for this request.
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Quote Already Submitted Banner */}
          {hasQuoted && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200 text-sm">
                    Quote Already Submitted
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Amount: ${existingQuote.quoteAmount} • Status: {existingQuote.status.replace(/_/g, ' ')}
                  </p>
                  {existingQuote.submittedAt && (
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Submitted {formatDistanceToNow(new Date(existingQuote.submittedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                onQuote(request);
                onOpenChange(false);
              }}
              disabled={hasQuoted}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
              data-testid="button-quote-job"
            >
              {hasQuoted ? `Quoted $${existingQuote.quoteAmount}` : 'Quote This Job'}
            </Button>
            <Button
              onClick={() => {
                onDecline(request);
                onOpenChange(false);
              }}
              disabled={hasQuoted}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-decline-job"
            >
              Decline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
