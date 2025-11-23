import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Truck,
  Phone,
  Mail
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface JobDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
}

const STATUS_CONFIG = {
  pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: Clock, label: "Pending" },
  quoted: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: DollarSign, label: "Quoted" },
  assigned: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle, label: "Assigned" },
  in_progress: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: Truck, label: "In Progress" },
  completed: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", icon: CheckCircle, label: "Completed" },
  operator_declined: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle, label: "Declined" }
};

export function JobDetailModal({ open, onOpenChange, request }: JobDetailModalProps) {
  const [, setLocation] = useLocation();

  if (!request) return null;

  const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isEmergency = request.isEmergency === 1;
  const isTracking = request.status === 'assigned' || request.status === 'in_progress';

  const handleTrackJob = () => {
    onOpenChange(false);
    setLocation(`/customer/job-tracking?requestId=${request.requestId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">
                {request.serviceType}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Request ID: {request.requestId}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Badge className={`${statusConfig.color} flex items-center gap-1.5 whitespace-nowrap`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </Badge>
              {isEmergency && (
                <Badge variant="destructive" className="flex items-center gap-1.5 whitespace-nowrap">
                  <AlertCircle className="w-3.5 h-3.5" />
                  EMERGENCY
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Timeline */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Requested</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                </span>
              </div>
              {request.quoteCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Quotes Received</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {request.quoteCount} {request.quoteCount === 1 ? 'quote' : 'quotes'}
                  </span>
                </div>
              )}
              {request.status === 'completed' && request.completedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Completed</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatDistanceToNow(new Date(request.completedAt), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Service Location
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm md:text-base text-gray-900 dark:text-white">{request.location}</p>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm md:text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                {request.description}
              </p>
            </div>
          </div>

          <Separator />

          {/* Budget */}
          {request.budgetRange && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Budget Range
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400">
                    {request.budgetRange}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Operator Info (if assigned) */}
          {request.operatorName && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assigned Operator
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {request.operatorName}
                  </p>
                  {request.operatorPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${request.operatorPhone}`} className="hover:text-orange-600 dark:hover:text-orange-400">
                        {request.operatorPhone}
                      </a>
                    </div>
                  )}
                  {request.operatorEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-1">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${request.operatorEmail}`} className="hover:text-orange-600 dark:hover:text-orange-400">
                        {request.operatorEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Quote Info */}
          {request.status === 'quoted' && request.quoteCount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {request.quoteCount} {request.quoteCount === 1 ? 'Quote' : 'Quotes'} Received
              </p>
              {request.lastQuoteAt && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Latest quote: {formatDistanceToNow(new Date(request.lastQuoteAt), { addSuffix: true })}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {isTracking && (
              <Button
                onClick={handleTrackJob}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-track-job-modal"
              >
                <Eye className="w-4 h-4 mr-2" />
                Track Job Progress
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              data-testid="button-close-modal"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
