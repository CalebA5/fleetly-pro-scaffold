import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CheckCircle2, XCircle, Clock, AlertCircle, User, Mail, Calendar, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OperatorApplication {
  id: number;
  applicationId: string;
  userId: string;
  tier: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  userName?: string;
  userEmail?: string;
  documents?: any[];
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<OperatorApplication | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);

  // Fetch all applications
  const { data: applications, isLoading } = useQuery<OperatorApplication[]>({
    queryKey: ["/api/admin/applications"],
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ applicationId, status, reason }: { applicationId: string; status: string; reason?: string }) => {
      return apiRequest(`/api/admin/applications/${applicationId}/review`, {
        method: "POST",
        body: JSON.stringify({
          status,
          rejectionReason: reason || undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      setReviewModalOpen(false);
      setSelectedApp(null);
      setRejectionReason("");
      toast({
        title: "Application reviewed",
        description: `Application ${reviewAction === "approved" ? "approved" : "rejected"} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review application",
        variant: "destructive",
      });
    },
  });

  const handleReview = (app: OperatorApplication, action: "approved" | "rejected") => {
    setSelectedApp(app);
    setReviewAction(action);
    
    if (action === "approved") {
      // Approve immediately without modal
      reviewMutation.mutate({
        applicationId: app.applicationId,
        status: "approved",
      });
    } else {
      // Open modal for rejection reason
      setReviewModalOpen(true);
    }
  };

  const submitRejection = () => {
    if (!selectedApp) return;
    
    reviewMutation.mutate({
      applicationId: selectedApp.applicationId,
      status: "rejected",
      reason: rejectionReason,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "under_review":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      case "pending":
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      manual: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      equipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      professional: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };

    return (
      <Badge className={colors[tier as keyof typeof colors] || ""}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const filterByStatus = (status?: string) => {
    if (!applications) return [];
    if (!status) return applications;
    return applications.filter(app => app.status === status);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  const pendingCount = applications?.filter(a => a.status === "pending").length || 0;
  const underReviewCount = applications?.filter(a => a.status === "under_review").length || 0;
  const approvedCount = applications?.filter(a => a.status === "approved").length || 0;
  const rejectedCount = applications?.filter(a => a.status === "rejected").length || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Operator Verification</h1>
        <p className="text-muted-foreground">Review and approve operator applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{underReviewCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Applications</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="under_review" data-testid="tab-under-review">Under Review ({underReviewCount})</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
        </TabsList>

        {["all", "pending", "under_review", "approved", "rejected"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterByStatus(status === "all" ? undefined : status).length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No applications found</p>
                </CardContent>
              </Card>
            ) : (
              filterByStatus(status === "all" ? undefined : status).map((app) => (
                <Card key={app.applicationId} data-testid={`application-card-${app.applicationId}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {app.userName || "Unknown User"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {app.userEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getTierBadge(app.tier)}
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Documents Section */}
                      {app.documents && app.documents.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Documents ({app.documents.length})
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {app.documents.map((doc, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(doc.documentUrl, "_blank")}
                                className="text-xs"
                                data-testid={`document-view-${idx}`}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                {doc.documentType || "Document"} - View
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {app.status === "rejected" && app.rejectionReason && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-400">{app.rejectionReason}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {(app.status === "pending" || app.status === "under_review") && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleReview(app, "approved")}
                            disabled={reviewMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`approve-button-${app.applicationId}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReview(app, "rejected")}
                            disabled={reviewMutation.isPending}
                            variant="destructive"
                            data-testid={`reject-button-${app.applicationId}`}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {app.status === "approved" && app.reviewedAt && (
                        <p className="text-sm text-muted-foreground">
                          Approved on {new Date(app.reviewedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Rejection Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. This will be shown to the operator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              data-testid="input-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitRejection}
              disabled={!rejectionReason.trim() || reviewMutation.isPending}
              data-testid="button-submit-rejection"
            >
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
