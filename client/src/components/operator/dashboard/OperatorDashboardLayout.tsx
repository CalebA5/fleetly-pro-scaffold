import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IOSToggle } from "@/components/ui/ios-toggle";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, X, Truck, AlertTriangle, Sparkles, Plus, ArrowRight } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { TierSwitcher } from "@/components/TierSwitcher";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MetricsSlider } from "./MetricsSlider";
import { TierTabs } from "./TierTabs";
import { JobsPanel } from "./JobsPanel";
import { NewRequestZone } from "./NewRequestZone";
import { EquipmentPanel } from "./EquipmentPanel";
import { ServicesPanel } from "./ServicesPanel";
import { HistoryPanel } from "./HistoryPanel";
import { ManpowerPanel } from "./ManpowerPanel";
import { LocationPermissionModal } from "@/components/LocationPermissionModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OperatorTier, Operator } from "@shared/schema";
import { 
  TIER_CAPABILITIES, 
  getMetricsForTier, 
  getTabsForTier
} from "@shared/tierCapabilities";

const TIER_LABELS: Record<string, string> = {
  professional: "Professional & Certified",
  equipped: "Skilled & Equipped",
  manual: "Manual Operator",
};

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
  const [showTierSwitchConfirm, setShowTierSwitchConfirm] = useState(false);
  const [tierSwitchInfo, setTierSwitchInfo] = useState<{ currentTier: string; newTier: string } | null>(null);

  const tierInfo = TIER_CAPABILITIES[tier];
  const metrics = getMetricsForTier(tier);
  const tabs = getTabsForTier(tier);
  const { location: userLocation, permissionStatus } = useUserLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [dismissedServicesSuggestion, setDismissedServicesSuggestion] = useState(false);

  const operatorId = user?.operatorId;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const firstName = user?.name?.split(" ")[0] || "Operator";
    if (hour < 12) return `Good morning, ${firstName}`;
    if (hour < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  }, [user?.name]);
  const hasLocation = userLocation !== null && permissionStatus === "granted";

  const { data: operatorData, isLoading: isLoadingOperator } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${operatorId}`],
    enabled: !!operatorId,
  });

  const tierProfiles = operatorData?.operatorTierProfiles as Record<string, any> | null;
  const tierProfile = tierProfiles?.[tier];

  const isApproved = tierProfile?.approvalStatus === "approved";
  const canGoOnline = isApproved && tierProfile?.canEarn !== false;

  // CRITICAL: isOnline should be TRUE only if operator is online AND on THIS SPECIFIC TIER
  // This ensures each tier dashboard correctly shows its own online status
  useEffect(() => {
    if (operatorData?.isOnline !== undefined) {
      // Operator is online for THIS tier only if isOnline=1 AND activeTier matches current tier
      const isOnlineForThisTier = operatorData.isOnline === 1 && operatorData.activeTier === tier;
      setIsOnline(isOnlineForThisTier);
    }
  }, [operatorData?.isOnline, operatorData?.activeTier, tier]);

  useEffect(() => {
    if (user && user.viewTier !== tier) {
      updateUser({ viewTier: tier });
    }
  }, [user?.viewTier, user?.operatorId, tier, updateUser]);

  const { data: metricsData = [], isLoading: isLoadingMetrics } = useQuery<MetricData[]>({
    queryKey: [`/api/operators/${operatorId}/dashboard-metrics/${tier}`],
    enabled: !!operatorId,
  });

  interface OperatorService {
    id: string;
    serviceId: string;
    name: string;
    isActive: boolean;
  }

  const { data: operatorServices = [] } = useQuery<OperatorService[]>({
    queryKey: [`/api/operators/${operatorId}/services`],
    enabled: !!operatorId,
  });

  const hasServices = operatorServices.length > 0;
  const activeServicesCount = operatorServices.filter(s => s.isActive).length;
  const showServicesSuggestion = !dismissedServicesSuggestion && !hasServices && isApproved;

  const handleToggleOnline = async (options: { confirmed?: boolean; forceOnline?: boolean } = {}) => {
    const { confirmed = false, forceOnline } = options;
    
    if (!canGoOnline) {
      toast({
        title: "Cannot Go Online",
        description: "Your account is pending verification. You can access the dashboard but cannot go online until approved.",
        variant: "destructive",
      });
      return;
    }

    // Determine target status: if forceOnline is set, use it; otherwise toggle current state
    const targetOnline = forceOnline !== undefined ? forceOnline : !isOnline;

    // Check if trying to go online without location
    if (targetOnline && !hasLocation) {
      setShowLocationModal(true);
      toast({
        title: "Location Required",
        description: "Please share your location to go online and receive nearby job requests.",
        variant: "default",
      });
      return;
    }

    try {
      const response = await fetch(`/api/operators/${operatorId}/toggle-online`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isOnline: targetOnline ? 1 : 0, activeTier: tier, confirmed }),
      });
      
      const data = await response.json();
      
      // Handle tier switch confirmation requirement
      if (data.requiresConfirmation && data.warning === "tier_switch") {
        setTierSwitchInfo({ 
          currentTier: data.currentTier, 
          newTier: data.newTier 
        });
        setShowTierSwitchConfirm(true);
        return;
      }
      
      // Handle errors
      if (!response.ok) {
        if (data.error === "active_jobs") {
          toast({
            title: "Active Jobs in Progress",
            description: data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to update online status.",
            variant: "destructive",
          });
        }
        return;
      }
      
      // Success - update local state and invalidate queries
      setIsOnline(targetOnline);
      
      // Update user context with new view tier if going online
      if (targetOnline && data.viewTier) {
        updateUser({ viewTier: data.viewTier, activeTier: data.activeTier });
      }
      
      // Invalidate all relevant queries to refresh UI across the app
      queryClient.invalidateQueries({ queryKey: ["/api/operators"] });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${operatorId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      
      toast({
        title: targetOnline ? "You're Online" : "You're Offline",
        description: targetOnline 
          ? `You can now receive ${TIER_LABELS[tier]} job requests.`
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
  
  const handleConfirmTierSwitch = async () => {
    setShowTierSwitchConfirm(false);
    setTierSwitchInfo(null);
    // Force go online with confirmed=true (we know user wants to go online since they confirmed)
    await handleToggleOnline({ confirmed: true, forceOnline: true });
  };
  
  const handleCancelTierSwitch = () => {
    setShowTierSwitchConfirm(false);
    setTierSwitchInfo(null);
  };

  const handleLocationGranted = async () => {
    setShowLocationModal(false);
    // After location is granted, try to go online using the full toggle flow
    if (canGoOnline && !isOnline) {
      // Use a small delay to ensure location state is updated
      setTimeout(() => {
        handleToggleOnline({ forceOnline: true });
      }, 100);
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

  const handleViewJob = (requestIdOrJobId: string) => {
    setLocation(`/operator/request/${requestIdOrJobId}`);
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
              <NotificationBell />
              
              <TierSwitcher />
              
              <ProfileDropdown 
                context="operator-dashboard"
                operatorTier={tier}
                operatorRating={operatorData?.rating ? Number(operatorData.rating) : undefined}
                operatorPhoto={operatorData?.photo || undefined}
                operatorServicesCount={activeServicesCount}
                isOnline={isOnline}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Online Status Bar */}
      <div className="sticky top-14 md:top-16 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-teal-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className={`text-sm font-medium ${isOnline ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {isOnline ? '• Receiving jobs' : '• Not receiving jobs'}
              </span>
            </div>
            <IOSToggle
              checked={isOnline}
              onCheckedChange={() => handleToggleOnline({})}
              disabled={!canGoOnline}
              size="sm"
              data-testid="online-toggle"
            />
          </div>
        </div>
      </div>

      <main className="container max-w-4xl mx-auto px-4 py-4 pb-24 md:pb-4 space-y-5">
        {/* Personalized Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white" data-testid="greeting-text">
              {greeting} {tierInfo.badge}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {tierInfo.label}
              {activeServicesCount > 0 && (
                <span className="ml-2 text-teal-600 dark:text-teal-400">
                  • {activeServicesCount} active service{activeServicesCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          {hasLocation && tierInfo.radiusKm && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500 dark:text-gray-400">Operating Radius</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{tierInfo.radiusKm} km</p>
            </div>
          )}
        </div>

        {/* Services Setup Suggestion */}
        {showServicesSuggestion && (
          <div className="relative flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 border border-teal-200/50 dark:border-teal-800/50">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50">
              <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-teal-800 dark:text-teal-200">
                Set up your services
              </h3>
              <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5 leading-relaxed">
                Add services you offer to start receiving job requests from customers.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => setActiveTab("services")}
                  className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs"
                  data-testid="button-setup-services"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Services
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-teal-600 hover:text-teal-800 hover:bg-teal-100 dark:text-teal-400 dark:hover:text-teal-200 dark:hover:bg-teal-900/50"
              onClick={() => setDismissedServicesSuggestion(true)}
              data-testid="button-dismiss-services-suggestion"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

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

        {isOnline && (
          <section data-testid="new-requests-section">
            <NewRequestZone
              operatorId={operatorId || ""}
              isOnline={isOnline}
              onViewRequest={handleViewJob}
            />
          </section>
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

      {/* Tier Switch Confirmation Dialog */}
      <Dialog open={showTierSwitchConfirm} onOpenChange={setShowTierSwitchConfirm}>
        <DialogContent className="bg-white dark:bg-gray-900 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="text-lg">Switch Online Status?</DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              You're currently online as <span className="font-semibold text-gray-900 dark:text-white">{tierSwitchInfo?.currentTier && TIER_LABELS[tierSwitchInfo.currentTier]}</span>. 
              Going online as <span className="font-semibold text-gray-900 dark:text-white">{tierSwitchInfo?.newTier && TIER_LABELS[tierSwitchInfo.newTier]}</span> will 
              automatically take you offline from {tierSwitchInfo?.currentTier && TIER_LABELS[tierSwitchInfo.currentTier]}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleCancelTierSwitch}
              className="flex-1"
              data-testid="button-cancel-online-switch"
            >
              Stay on {tierSwitchInfo?.currentTier && TIER_LABELS[tierSwitchInfo.currentTier]}
            </Button>
            <Button
              onClick={handleConfirmTierSwitch}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              data-testid="button-confirm-online-switch"
            >
              Switch to {tierSwitchInfo?.newTier && TIER_LABELS[tierSwitchInfo.newTier]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileBottomNav context="operator" />
    </div>
  );
}
