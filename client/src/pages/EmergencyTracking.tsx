import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, MapPin, Phone, Clock, CheckCircle, Loader2, User, Users, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmergencyRequest, DispatchQueue } from "@shared/schema";

interface EmergencyWithQueue extends EmergencyRequest {
  queue?: (DispatchQueue & { operatorName?: string; operatorPhone?: string })[];
  notifiedCount?: number;
}

export default function EmergencyTracking() {
  const { emergencyId } = useParams<{ emergencyId: string }>();
  const [, setLocation] = useLocation();

  const { data: emergency, isLoading } = useQuery<EmergencyWithQueue>({
    queryKey: [`/api/emergency-requests/${emergencyId}`],
    refetchInterval: 3000, // Poll every 3 seconds for updates
    enabled: !!emergencyId, // Only run query if we have an emergencyId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading emergency details...</p>
        </div>
      </div>
    );
  }

  if (!emergency) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
            Emergency Request Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to find emergency request #{emergencyId}
          </p>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "searching":
        return {
          icon: Loader2,
          text: "Finding Nearby Operators...",
          color: "text-orange-600 dark:text-orange-400",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-300 dark:border-orange-600",
          animate: "animate-spin",
        };
      case "operator_assigned":
        return {
          icon: User,
          text: "Operator Assigned - Preparing to Respond",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-300 dark:border-blue-600",
          animate: "",
        };
      case "en_route":
        return {
          icon: MapPin,
          text: "Operator En Route",
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
          borderColor: "border-purple-300 dark:border-purple-600",
          animate: "animate-pulse",
        };
      case "completed":
        return {
          icon: CheckCircle,
          text: "Emergency Resolved",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-300 dark:border-green-600",
          animate: "",
        };
      default:
        return {
          icon: Clock,
          text: "Processing Request...",
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-300 dark:border-gray-600",
          animate: "",
        };
    }
  };

  const statusInfo = getStatusInfo(emergency.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {/* Header with Navigation */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 dark:from-red-700 dark:to-orange-600 text-white py-4 px-4 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-white hover:bg-white/20"
              data-testid="button-back-home"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
            <span className="text-xs text-white/70 bg-white/20 px-2 py-1 rounded-full">
              #{emergency.emergencyId}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-7 h-7 md:w-8 md:h-8 animate-pulse" />
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                EMERGENCY TRACKING
              </h1>
              <p className="text-white/90 text-xs md:text-sm truncate max-w-[250px] md:max-w-none">
                {emergency.serviceType} - {emergency.location && emergency.location.length > 30 
                  ? `${emergency.location.substring(0, 30)}...` 
                  : emergency.location}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Status Card */}
        <div className={`${statusInfo.bgColor} border-2 ${statusInfo.borderColor} rounded-2xl p-6 md:p-8`}>
          <div className="flex items-center gap-4 mb-4">
            <StatusIcon className={`w-10 h-10 md:w-12 md:h-12 ${statusInfo.color} ${statusInfo.animate}`} />
            <div>
              <h2 className={`text-xl md:text-2xl font-bold ${statusInfo.color}`}>
                {statusInfo.text}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Last updated: {new Date(emergency.updatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {emergency.status === "searching" && (
            <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base">
              We're notifying the 5 nearest operators in your area. You should receive a call within minutes.
            </p>
          )}
        </div>

        {/* Emergency Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
          <h3 className="text-xl font-bold text-black dark:text-white mb-4">
            Emergency Details
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Service Type
                </p>
                <p className="text-base font-semibold text-black dark:text-white capitalize">
                  {emergency.serviceType}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Location
                </p>
                <p className="text-base text-black dark:text-white">
                  {emergency.location}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Contact Phone
                </p>
                <p className="text-base font-semibold text-black dark:text-white">
                  {emergency.contactPhone}
                </p>
              </div>
            </div>

            {emergency.contactName && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Contact Name
                  </p>
                  <p className="text-base text-black dark:text-white">
                    {emergency.contactName}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </p>
                <p className="text-base text-black dark:text-white">
                  {emergency.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Operator Queue Status */}
        {emergency.queue && emergency.queue.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-bold text-black dark:text-white">
                Notified Operators ({emergency.queue.length})
              </h3>
            </div>

            <div className="space-y-3">
              {emergency.queue.map((q, index) => {
                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case "notified":
                      return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600";
                    case "accepted":
                      return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600";
                    case "declined":
                      return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
                    case "pending":
                      return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600";
                    default:
                      return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
                  }
                };

                return (
                  <div
                    key={q.queueId}
                    className={`p-4 rounded-xl border-2 ${
                      q.status === "accepted" 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600" 
                        : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold text-sm">
                          #{q.queuePosition}
                        </span>
                        <span className="font-semibold text-black dark:text-white">
                          {q.operatorName || "Operator"}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(q.status)}`}>
                        {q.status.toUpperCase()}
                      </span>
                    </div>
                    {q.distanceKm && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📍 {parseFloat(q.distanceKm).toFixed(1)} km away
                      </p>
                    )}
                    {q.status === "accepted" && q.operatorPhone && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                        ✅ Assigned! Operator will contact you at {emergency.contactPhone}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm md:text-base">
            <strong>Important:</strong> Keep your phone nearby. An operator will call you shortly to confirm details and provide an estimated arrival time.
          </p>
        </div>
      </div>
    </div>
  );
}
