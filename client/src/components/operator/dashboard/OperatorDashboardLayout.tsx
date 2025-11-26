import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, X, Home } from "lucide-react";
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
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);

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
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="operator-dashboard">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setLocation("/drive-earn")}
                  data-testid="button-home"
                >
                  <Home className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="font-bold text-base leading-tight text-gray-900 dark:text-white">
                    {tierInfo.badge} {tierInfo.label.split(" ")[0]}
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleOnline}
                disabled={!canGoOnline}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                  !canGoOnline 
                    ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed" 
                    : isOnline 
                      ? "bg-green-500" 
                      : "bg-gray-300 dark:bg-gray-600"
                }`}
                data-testid="online-toggle"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ${
                    isOnline ? "translate-x-8" : "translate-x-1"
                  }`}
                />
                <span className={`absolute text-[10px] font-semibold ${isOnline ? "left-1.5 text-white" : "right-1.5 text-gray-500 dark:text-gray-400"}`}>
                  {isOnline ? "ON" : "OFF"}
                </span>
              </button>
              
              <NotificationBell />
              
              <TierSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-4 space-y-5">
        {!isApproved && showVerificationBanner && (
          <div className="relative flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/50 dark:border-amber-800/50">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-200">
                Verification Pending
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                You can explore the dashboard but cannot go online until approved.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/50"
              onClick={() => setShowVerificationBanner(false)}
              data-testid="button-dismiss-verification"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <section data-testid="metrics-section">
          <MetricsSlider
            tier={tier}
            metrics={metrics}
            data={metricsData}
            isLoading={isLoadingMetrics}
            onMetricClick={(metricId) => {
              console.log("Metric clicked:", metricId);
            }}
            onTabChange={(tabId) => setActiveTab(tabId)}
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
              manpower: tier === "professional" ? (
                <ManpowerPanel
                  tier={tier}
                  operatorId={operatorId || ""}
                  businessId={operatorData?.businessId || undefined}
                />
              ) : null,
              history: (
                <HistoryPanel
                  tier={tier}
                  operatorId={operatorId || ""}
                  onViewJob={handleViewJob}
                />
              ),
            }}
          </TierTabs>
        </section>
      </main>
    </div>
  );
}
