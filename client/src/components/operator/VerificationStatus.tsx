import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Clock, Mail, AlertCircle } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VerificationStatusProps {
  tier: "manual" | "equipped" | "professional";
}

export function VerificationStatus({ tier }: VerificationStatusProps) {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");

  // Fetch verification status
  const { data: verificationStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ["/api/verification/status"],
  });

  // Fetch application status for the tier
  const { data: applications, isLoading: loadingApplications } = useQuery<any[]>({
    queryKey: ["/api/operator/applications"],
  });

  const tierApplication = applications?.find((app) => app.tier === tier);

  // Send verification email
  const sendVerificationMutation = useMutation({
    mutationFn: () => apiRequest("/api/verification/send-email", { method: "POST" }),
    onSuccess: () => {
      toast({
        title: "Verification code sent",
        description: "Check your email for the 6-digit verification code.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send code",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Verify email code
  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => 
      apiRequest("/api/verification/verify-email", { 
        method: "POST",
        body: JSON.stringify({ token })
      }),
    onSuccess: () => {
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/verification/status"] });
      setVerificationCode("");
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code.",
        variant: "destructive",
      });
    },
  });

  if (loadingStatus || loadingApplications) {
    return (
      <Card data-testid="verification-status-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading verification status...</div>
        </CardContent>
      </Card>
    );
  }

  const isEmailVerified = verificationStatus?.emailVerified;
  const isApplicationApproved = tierApplication?.status === "approved";
  const isApplicationPending = tierApplication && !["approved", "rejected"].includes(tierApplication.status);
  const isFullyVerified = isEmailVerified && (!tierApplication || isApplicationApproved);

  return (
    <Card data-testid="verification-status-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verification Status
        </CardTitle>
        <CardDescription>
          Complete verification to start accepting jobs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Verification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Email Verification</span>
          </div>
          {isEmailVerified ? (
            <Badge variant="default" className="bg-green-600" data-testid="badge-email-verified">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary" data-testid="badge-email-pending">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>

        {!isEmailVerified && (
          <div className="space-y-3" data-testid="email-verification-section">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Verify your email address to start accepting jobs.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={() => sendVerificationMutation.mutate()}
                disabled={sendVerificationMutation.isPending}
                className="w-full"
                data-testid="button-send-verification"
              >
                {sendVerificationMutation.isPending ? "Sending..." : "Send Verification Code"}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="verification-code"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    data-testid="input-verification-code"
                  />
                  <Button
                    onClick={() => verifyEmailMutation.mutate(verificationCode)}
                    disabled={verificationCode.length !== 6 || verifyEmailMutation.isPending}
                    data-testid="button-verify-code"
                  >
                    {verifyEmailMutation.isPending ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tier Application Status (if exists) */}
        {tierApplication && (
          <div className="flex items-center justify-between" data-testid="tier-application-status">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tier Application</span>
            </div>
            {isApplicationApproved ? (
              <Badge variant="default" className="bg-green-600" data-testid="badge-application-approved">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            ) : isApplicationPending ? (
              <Badge variant="secondary" data-testid="badge-application-pending">
                <Clock className="h-3 w-3 mr-1" />
                {tierApplication.status === "under_review" ? "Under Review" : "Pending"}
              </Badge>
            ) : (
              <Badge variant="destructive" data-testid="badge-application-rejected">
                Rejected
              </Badge>
            )}
          </div>
        )}

        {/* Overall Status */}
        {isFullyVerified && (
          <Alert className="bg-green-50 border-green-200" data-testid="alert-fully-verified">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              You're all set! You can now accept and complete jobs.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
