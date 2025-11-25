import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { TierSwitcher } from "@/components/TierSwitcher";
import { MetricsSlider } from "./MetricsSlider";
import { TierTabs } from "./TierTabs";
import { DrawerNav } from "./DrawerNav";
import { JobsPanel } from "./JobsPanel";
import { EquipmentPanel } from "./EquipmentPanel";
import { ServicesPanel } from "./ServicesPanel";
import { HistoryPanel } from "./HistoryPanel";
import { ManpowerPanel } from "./ManpowerPanel";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OperatorTier, Operator } from "@shared/schema";
import { 
  TIER_CAPABILITIES, 
  getMetricsForTier, 
  getTabsForTier, 
  getDrawerMenuForTier 
} from "@shared/tierCapabilities";

interface MetricData {
  id: string;
  value: number | string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

interface OperatorDashboardLayoutProps {
  tier: OperatorTier;
}

export function OperatorDashboardLayout({ tier }: OperatorDashboardLayoutProps) {
  const { user, updateUser, signOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("jobs");
  const [isOnline, setIsOnline] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [quoteJobId, setQuoteJobId] = useState<string | null>(null);
  const [declineJobId, setDeclineJobId] = useState<string | null>(null);

  const tierInfo = TIER_CAPABILITIES[tier];
  const metrics = getMetricsForTier(tier);
  const tabs = getTabsForTier(tier);
  const menuItems = getDrawerMenuForTier(tier);

  const operatorId = user?.operatorId;

  const { data: operatorData, isLoading: isLoadingOperator } = useQuery<Operator>({
    queryKey: ["/api/operators/by-id", operatorId],
    enabled: !!operatorId,
  });

  const { data: tierProfile } = useQuery<{
    approvalStatus: string;
    canEarn: boolean;
  }>({
    queryKey: ["/api/operators", operatorId, "tier-profile", tier],
    enabled: !!operatorId,
  });

  const isApproved = tierProfile?.approvalStatus === "approved";
  const canGoOnline = isApproved && tierProfile?.canEarn !== false;

  useEffect(() => {
    if (operatorData?.isOnline !== undefined) {
      setIsOnline(operatorData.isOnline === 1);
    }
  }, [operatorData?.isOnline]);

  useEffect(() => {
    if (user && user.viewTier !== tier) {
      updateUser({ viewTier: tier });
    }
  }, [user?.viewTier, user?.operatorId, tier, updateUser]);

  const { data: metricsData = [], isLoading: isLoadingMetrics } = useQuery<MetricData[]>({
    queryKey: ["/api/operators", operatorId, "dashboard-metrics", tier],
    enabled: !!operatorId,
  });

  const handleToggleOnline = async () => {
    if (!canGoOnline) {
      toast({
        title: "Cannot Go Online",
        description: "Your account is pending verification. You can access the dashboard but cannot go online until approved.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newStatus = !isOnline;
      await apiRequest(`/api/operators/${operatorId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isOnline: newStatus ? 1 : 0 }),
      });
      setIsOnline(newStatus);
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      toast({
        title: newStatus ? "You're Online" : "You're Offline",
        description: newStatus 
          ? "You can now receive job requests in your area."
          : "You won't receive new job requests.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update online status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleViewJob = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      await apiRequest(`/api/service-requests/${jobId}/accept`, {
        method: "POST",
        body: JSON.stringify({ operatorId }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({
        title: "Job Accepted",
        description: "You've accepted this job. Check your active jobs tab.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineJob = (jobId: string) => {
    setDeclineJobId(jobId);
  };

  const handleSubmitQuote = (jobId: string) => {
    setQuoteJobId(jobId);
  };

  const handleProfileClick = () => {
    setLocation("/profile");
  };

  if (isLoadingOperator) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="operator-dashboard">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DrawerNav
                tier={tier}
                menuItems={menuItems}
                operator={{
                  name: operatorData?.name || user?.name || "Operator",
                  email: user?.email,
                  photo: operatorData?.photo || undefined,
                  rating: operatorData?.rating ? Number(operatorData.rating) : undefined,
                }}
                onLogout={handleLogout}
                onProfileClick={handleProfileClick}
              />
              <div>
                <h1 className="font-semibold text-lg leading-tight">
                  {tierInfo.badge} {tierInfo.label}
                </h1>
                <div className="flex items-center gap-2">
                  {!isApproved && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Verification
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isOnline ? "text-green-600" : "text-muted-foreground"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
                <Switch
                  checked={isOnline}
                  onCheckedChange={handleToggleOnline}
                  disabled={!canGoOnline}
                  data-testid="online-toggle"
                />
              </div>
              
              <NotificationBell />
              
              <TierSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-4 space-y-6">
        {!isApproved && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">
                Account Verification Pending
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Your account is currently under review. You can explore the dashboard and set up your profile, 
                but you won't be able to go online and receive job requests until your account is approved.
              </p>
            </div>
          </div>
        )}

        <section data-testid="metrics-section">
          <MetricsSlider
            tier={tier}
            metrics={metrics}
            data={metricsData}
            isLoading={isLoadingMetrics}
            onMetricClick={(metricId) => {
              if (metricId === "jobsNearby" || metricId === "activeJobs") {
                setActiveTab("jobs");
              }
            }}
          />
        </section>

        <section data-testid="tabs-section">
          <TierTabs
            tier={tier}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {{
              jobs: (
                <JobsPanel
                  tier={tier}
                  operatorId={operatorId || ""}
                  isOnline={isOnline}
                  onViewJob={handleViewJob}
                  onAcceptJob={handleAcceptJob}
                  onDeclineJob={handleDeclineJob}
                  onSubmitQuote={handleSubmitQuote}
                />
              ),
              equipment: (
                <EquipmentPanel
                  tier={tier}
                  operatorId={operatorId || ""}
                />
              ),
              services: (
                <ServicesPanel
                  tier={tier}
                  operatorId={operatorId || ""}
                />
              ),
              history: (
                <HistoryPanel
                  tier={tier}
                  operatorId={operatorId || ""}
                  onViewJob={handleViewJob}
                />
              ),
              manpower: tier === "professional" ? (
                <ManpowerPanel
                  tier={tier}
                  operatorId={operatorId || ""}
                  businessId={operatorData?.businessId || undefined}
                />
              ) : null,
            }}
          </TierTabs>
        </section>
      </main>
    </div>
  );
}
