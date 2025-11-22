import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AlertCircle, MapPin, DollarSign, Clock, CheckCircle, X } from "lucide-react";

export interface UrgentRequest {
  id: string;
  type: "emergency" | "new_job";
  customerName: string;
  serviceType: string;
  location: string;
  distance: number; // in km
  estimatedValue: string;
  description?: string;
  expiresIn: number; // minutes
  isEmergency?: boolean;
}

interface UrgentRequestNotificationProps {
  requests: UrgentRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onDismiss: (requestId: string) => void;
}

export function UrgentRequestNotification({
  requests,
  onAccept,
  onDecline,
  onDismiss,
}: UrgentRequestNotificationProps) {
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeRequest, setActiveRequest] = useState<UrgentRequest | null>(null);
  const [dismissedRequests, setDismissedRequests] = useState<Set<string>>(new Set());

  // Auto-show new requests
  useEffect(() => {
    const availableRequests = requests.filter(
      (req) => !dismissedRequests.has(req.id)
    );

    if (availableRequests.length > 0 && !activeRequest) {
      const nextRequest = availableRequests[0];
      setActiveRequest(nextRequest);

      // Show toast notification for non-mobile or when sheet is not shown
      if (!isMobile || nextRequest.type === "new_job") {
        toast({
          title: nextRequest.type === "emergency" ? "🚨 URGENT REQUEST!" : "📬 New Job Available",
          description: `${nextRequest.serviceType} - ${nextRequest.location}`,
          duration: nextRequest.type === "emergency" ? 10000 : 5000,
        });
      }
    }
  }, [requests, activeRequest, dismissedRequests, isMobile, toast]);

  const handleAccept = () => {
    if (!activeRequest) return;
    onAccept(activeRequest.id);
    setDismissedRequests((prev) => new Set(prev).add(activeRequest.id));
    setActiveRequest(null);
  };

  const handleDecline = () => {
    if (!activeRequest) return;
    onDecline(activeRequest.id);
    setDismissedRequests((prev) => new Set(prev).add(activeRequest.id));
    setActiveRequest(null);
  };

  const handleDismiss = () => {
    if (!activeRequest) return;
    onDismiss(activeRequest.id);
    setDismissedRequests((prev) => new Set(prev).add(activeRequest.id));
    setActiveRequest(null);
  };

  if (!activeRequest) return null;

  const isEmergency = activeRequest.type === "emergency";

  // Mobile: Bottom sheet for emergency requests
  if (isMobile && isEmergency) {
    return (
      <Sheet open={true} onOpenChange={(open) => !open && handleDismiss()}>
        <SheetContent 
          side="bottom" 
          className={`
            bg-white dark:bg-gray-900 
            ${isEmergency ? 'border-t-4 border-red-500' : 'border-t-4 border-orange-500'}
          `}
          data-testid="sheet-urgent-request"
        >
          <SheetHeader>
            <div className="flex items-center gap-2">
              {isEmergency && <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 animate-pulse" />}
              <SheetTitle className="text-black dark:text-white flex-1">
                {isEmergency ? "🚨 URGENT REQUEST!" : "New Job Available"}
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                data-testid="button-dismiss-urgent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SheetDescription className="text-gray-600 dark:text-gray-400">
              Customer needs immediate assistance
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Customer</p>
                <p className="font-semibold text-black dark:text-white">{activeRequest.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Service</p>
                <Badge className={isEmergency ? "bg-red-500 text-white" : "bg-orange-500 text-white"}>
                  {activeRequest.serviceType}
                </Badge>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{activeRequest.location}</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {activeRequest.distance} km away
                </span>
              </div>
            </div>

            {activeRequest.description && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-black dark:text-white">{activeRequest.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 pb-1 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-bold text-lg text-black dark:text-white">{activeRequest.estimatedValue}</span>
              </div>
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-semibold">Expires in {activeRequest.expiresIn}m</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleDecline}
                className="flex-1 border-2"
                data-testid="button-decline-urgent"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                className={`
                  flex-1 text-white
                  ${isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}
                `}
                data-testid="button-accept-urgent"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Job
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Floating card overlay for emergency requests
  if (!isMobile && isEmergency) {
    return (
      <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5">
        <div
          className={`
            w-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2
            ${isEmergency ? 'border-red-500' : 'border-orange-500'}
          `}
          data-testid="card-urgent-request"
        >
          <div className={`p-4 ${isEmergency ? 'bg-red-50 dark:bg-red-950' : 'bg-orange-50 dark:bg-orange-950'} rounded-t-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isEmergency && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 animate-pulse" />}
                <h3 className="font-bold text-black dark:text-white">
                  {isEmergency ? "🚨 URGENT REQUEST!" : "New Job Available"}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
                data-testid="button-dismiss-urgent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Customer:</span>
              <span className="font-semibold text-black dark:text-white">{activeRequest.customerName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Service:</span>
              <Badge className={isEmergency ? "bg-red-500 text-white" : "bg-orange-500 text-white"}>
                {activeRequest.serviceType}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span className="text-sm flex-1">{activeRequest.location}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {activeRequest.distance} km
              </span>
            </div>

            {activeRequest.description && (
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm text-black dark:text-white">
                {activeRequest.description}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-bold text-black dark:text-white">{activeRequest.estimatedValue}</span>
              </div>
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold">Expires in {activeRequest.expiresIn}m</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleDecline}
                className="flex-1"
                size="sm"
                data-testid="button-decline-urgent"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                className={`
                  flex-1 text-white
                  ${isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}
                `}
                size="sm"
                data-testid="button-accept-urgent"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For non-emergency new jobs, just show toast (handled in useEffect)
  return null;
}
