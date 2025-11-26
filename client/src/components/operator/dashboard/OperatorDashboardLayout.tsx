import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, X, Truck } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { TierSwitcher } from "@/components/TierSwitcher";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MetricsSlider } from "./MetricsSlider";
import { TierTabs } from "./TierTabs";
import { JobsPanel } from "./JobsPanel";
import { EquipmentPanel } from "./EquipmentPanel";
import { ServicesPanel } from "./ServicesPanel";
import { HistoryPanel } from "./HistoryPanel";
import { ManpowerPanel } from "./ManpowerPanel";
import { LocationPermissionModal } from "@/components/LocationPermissionModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OperatorTier, Operator } from "@shared/schema";
import { 
  TIER_CAPABILITIES, 
  getMetricsForTier, 
  getTabsForTier
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
  const { location: userLocation, permissionStatus } = useUserLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const operatorId = user?.operatorId;
  const hasLocation = userLocation !== null && permissionStatus === "granted";

  const { data: operatorData, isLoading: isLoadingOperator } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${operatorId}`],
    enabled: !!operatorId,
  });

  const tierProfiles = operatorData?.operatorTierProfiles as Record<string, any> | null;
  const tierProfile = tierProfiles?.[tier];

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
    queryKey: [`/api/operators/${operatorId}/dashboard-metrics/${tier}`],
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

    // Check if trying to go online without location
    if (!isOnline && !hasLocation) {
      setShowLocationModal(true);
      toast({
        title: "Location Required",
        description: "Please share your location to go online and receive nearby job requests.",
        variant: "default",
      });
      return;
    }

    try {
      const newStatus = !isOnline;
      await apiRequest(`/api/operators/${operatorId}/toggle-online`, {
        method: "POST",
        body: JSON.stringify({ isOnline: newStatus ? 1 : 0, activeTier: tier }),
      });
      setIsOnline(newStatus);
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${operatorId}`] });
      toast({
        title: newStatus ? "You're Online" : "You're Offline",
        description: newStatus 
          ? "You can now receive job requests in your area."
          : "You won't receive new job requests.",
      });
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to update online status. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleLocationGranted = async () => {
    setShowLocationModal(false);
    // After location is granted, try to go online
    if (canGoOnline) {
      try {
        await apiRequest(`/api/operators/${operatorId}/toggle-online`, {
          method: "POST",
          body: JSON.stringify({ isOnline: 1, activeTier: tier }),
        });
        setIsOnline(true);
        queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
        queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${operatorId}`] });
        toast({
          title: "You're Online",
          description: "You can now receive job requests in your area.",
        });
      } catch (error: any) {
        const errorMessage = error?.message || "Failed to go online. Please try again.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center">
                <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-home-logo">
                  <Truck className="text-black dark:text-white w-6 h-6 md:w-8 md:h-8" />
                  <span className="font-bold text-black dark:text-white ml-2 text-xl md:text-2xl hidden sm:inline">
                    Fleetly
                  </span>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`text-xs font-medium ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <button
                  onClick={handleToggleOnline}
                  disabled={!canGoOnline}
                  className={`relative inline-flex h-[14px] w-6 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 ${
                    !canGoOnline 
                      ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50" 
                      : isOnline 
                        ? "bg-emerald-500" 
                        : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  }`}
                  data-testid="online-toggle"
                >
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 h-[10px] w-[10px] rounded-full bg-white shadow-sm transition-all duration-200 ${
                      isOnline ? "left-[12px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              
              <NotificationBell />
              
              <TierSwitcher />
              
              <ProfileDropdown 
                context="operator-dashboard"
                operatorTier={tier}
                operatorRating={operatorData?.rating ? Number(operatorData.rating) : undefined}
                operatorPhoto={operatorData?.photo || undefined}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-4 pb-24 md:pb-4 space-y-5">
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

      <LocationPermissionModal
        open={showLocationModal}
        onOpenChange={(open) => {
          setShowLocationModal(open);
          if (!open && userLocation) {
            handleLocationGranted();
          }
        }}
      />

      <MobileBottomNav context="operator" />
    </div>
  );
}
