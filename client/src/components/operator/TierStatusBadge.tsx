import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { useOperatorVerification } from "@/hooks/useOperatorVerification";
import { Skeleton } from "@/components/ui/skeleton";

interface TierStatusBadgeProps {
  tier: "manual" | "equipped" | "professional";
  showFullStatus?: boolean;
}

export function TierStatusBadge({ tier, showFullStatus = false }: TierStatusBadgeProps) {
  const {
    canAcceptJobs,
    isEmailVerified,
    isApplicationPending,
    tierApplication,
    isLoading,
  } = useOperatorVerification(tier);

  if (isLoading) {
    return <Skeleton className="h-6 w-32" data-testid="tier-status-loading" />;
  }

  // Fully verified - can accept jobs
  if (canAcceptJobs) {
    return (
      <Badge 
        variant="default" 
        className="bg-green-600 text-white" 
        data-testid="tier-status-verified"
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {showFullStatus ? "Verified & Active" : "Verified"}
      </Badge>
    );
  }

  // Email not verified
  if (!isEmailVerified) {
    return (
      <Badge 
        variant="secondary" 
        className="bg-amber-100 text-amber-800 border-amber-300"
        data-testid="tier-status-email-pending"
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        {showFullStatus ? "Email Verification Required" : "Email Pending"}
      </Badge>
    );
  }

  // Application pending review
  if (isApplicationPending) {
    return (
      <Badge 
        variant="secondary" 
        className="bg-blue-100 text-blue-800 border-blue-300"
        data-testid="tier-status-application-pending"
      >
        <Clock className="h-3 w-3 mr-1" />
        {tierApplication?.status === "under_review" 
          ? (showFullStatus ? "Under Review" : "Reviewing") 
          : (showFullStatus ? "Waiting for Authentication" : "Pending")}
      </Badge>
    );
  }

  // Application rejected
  if (tierApplication?.status === "rejected") {
    return (
      <Badge 
        variant="destructive"
        data-testid="tier-status-rejected"
      >
        <XCircle className="h-3 w-3 mr-1" />
        {showFullStatus ? "Application Rejected" : "Rejected"}
      </Badge>
    );
  }

  // Default - waiting for verification
  return (
    <Badge 
      variant="secondary"
      data-testid="tier-status-default"
    >
      <Clock className="h-3 w-3 mr-1" />
      {showFullStatus ? "Verification Pending" : "Pending"}
    </Badge>
  );
}
