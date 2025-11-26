import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Operator, ServiceRequest } from "@shared/schema";

const TIER_INFO = {
  professional: { label: "Professional & Certified", shortLabel: "Pro", badge: "🏆", color: "text-amber-600" },
  equipped: { label: "Skilled & Equipped", shortLabel: "Equipped", badge: "🚛", color: "text-blue-600" },
  manual: { label: "Manual Operator", shortLabel: "Manual", badge: "⛏️", color: "text-green-600" },
};

const equippedTierSchema = z.object({
  vehicle: z.string().min(1, "Vehicle is required"),
  licensePlate: z.string().min(1, "License plate is required"),
  services: z.string().min(1, "Services are required"),
});

const professionalTierSchema = z.object({
  businessLicense: z.string().min(1, "Business license is required"),
  vehicle: z.string().min(1, "Vehicle is required"),
  licensePlate: z.string().min(1, "License plate is required"),
  services: z.string().min(1, "Services are required"),
});

export function TierSwitcher() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"professional" | "equipped" | "manual" | null>(null);
  const [showOnlineWarning, setShowOnlineWarning] = useState(false);
  const [showActiveJobWarning, setShowActiveJobWarning] = useState(false);
  const [pendingTierSwitch, setPendingTierSwitch] = useState<"professional" | "equipped" | "manual" | null>(null);

  // Fetch operator data to get authoritative tier information
  // This ensures subscribed tiers are always up-to-date from the database
  const { data: operatorData } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}`],
    enabled: !!user?.operatorId,
  });

  // Use operator data from API as the source of truth for subscribed tiers
  // Fall back to user context only if API data isn't available yet
  const subscribedTiers = operatorData?.subscribedTiers || user?.subscribedTiers || [user?.activeTier || user?.operatorTier];
  
  // viewTier = which dashboard is being viewed (for dropdown button display)
  // activeTier = which tier is online (for online badge only)
  // CRITICAL: viewTier should reflect the CURRENT dashboard, not default to professional
  // Fallback priority: database viewTier > user context viewTier > first subscribed tier > operatorTier
  const viewTier = operatorData?.viewTier || user?.viewTier || subscribedTiers[0] || user?.operatorTier || "manual";
  
  // Online badge shows which tier the operator is actively online with
  // Note: Switching tiers does NOT automatically make you online on the new tier
  // Operators must explicitly click "Go Online" on each tier's dashboard to go online
  const onlineTier = operatorData?.isOnline === 1 ? operatorData?.activeTier : null;

  // Check for active jobs on current tier
  const { data: activeJobs = [] } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/operators/${user?.operatorId}/active-jobs`],
    enabled: !!user?.operatorId,
  });
  
  const hasActiveJob = activeJobs.length > 0;

  const equippedForm = useForm({
    resolver: zodResolver(equippedTierSchema),
    defaultValues: {
      vehicle: "",
      licensePlate: "",
      services: "",
    },
  });

  const professionalForm = useForm({
    resolver: zodResolver(professionalTierSchema),
    defaultValues: {
      businessLicense: "",
      vehicle: "",
      licensePlate: "",
      services: "",
    },
  });

  const switchTierMutation = useMutation({
    mutationFn: async (newTier: "professional" | "equipped" | "manual") => {
      return apiRequest(`/api/operators/${user?.operatorId}/switch-tier`, {
        method: "POST",
        body: JSON.stringify({ newTier }),
      });
    },
    onSuccess: async (_, newTier) => {
      updateUser({ viewTier: newTier });
      
      // Invalidate operator query so Online badge updates immediately
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user?.operatorId}`] });
      
      // Refetch session once to ensure frontend is in sync with backend
      let freshBusinessId = user?.businessId;
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        if (response.ok) {
          const userData = await response.json();
          updateUser({
            activeTier: userData.activeTier,
            viewTier: userData.viewTier,
            businessId: userData.businessId,
            subscribedTiers: userData.subscribedTiers,
          });
          freshBusinessId = userData.businessId;
        }
      } catch (error) {
        console.error("Failed to refetch session:", error);
      }
      
      toast({
        title: "Tier Switched",
        description: `You are now operating as ${TIER_INFO[newTier].label}`,
      });
      
      // Navigate to the unified operator dashboard with tier parameter
      // This ensures the correct dashboard is shown immediately
      setLocation(`/operator?tier=${newTier}`);
    },
  });

  const addTierMutation = useMutation({
    mutationFn: async (data: { tier: string; details: any }) => {
      return apiRequest(`/api/operators/${user?.operatorId}/add-tier`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: async (_, variables) => {
      const newSubscribedTiers = [...subscribedTiers, variables.tier] as ("professional" | "equipped" | "manual")[];
      updateUser({ 
        subscribedTiers: newSubscribedTiers,
        viewTier: variables.tier as "professional" | "equipped" | "manual"
      });
      
      // Invalidate operator query so Online badge updates immediately
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user?.operatorId}`] });
      
      // Refetch session once to ensure frontend is in sync with backend
      let freshBusinessId = user?.businessId;
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        if (response.ok) {
          const userData = await response.json();
          updateUser({
            activeTier: userData.activeTier,
            viewTier: userData.viewTier,
            businessId: userData.businessId,
            subscribedTiers: userData.subscribedTiers,
          });
          freshBusinessId = userData.businessId;
        }
      } catch (error) {
        console.error("Failed to refetch session:", error);
      }
      
      toast({
        title: "Tier Added",
        description: `You can now operate as ${TIER_INFO[variables.tier as keyof typeof TIER_INFO].label}`,
      });
      setShowUpgradeDialog(false);
      setSelectedTier(null);
      
      // Navigate to the unified operator dashboard with tier parameter
      setLocation(`/operator?tier=${variables.tier}`);
    },
  });

  const handleTierClick = (tier: "professional" | "equipped" | "manual") => {
    // If already on this tier, do nothing
    if (tier === viewTier) return;
    
    if (subscribedTiers.includes(tier)) {
      // Check for active jobs first - cannot switch with active jobs
      if (hasActiveJob) {
        setPendingTierSwitch(tier);
        setShowActiveJobWarning(true);
        return;
      }
      
      // Check if online on another tier - warn before switching
      if (onlineTier && onlineTier !== tier) {
        setPendingTierSwitch(tier);
        setShowOnlineWarning(true);
        return;
      }
      
      switchTierMutation.mutate(tier);
    } else {
      // Redirect to full onboarding flow instead of showing simple dialog
      setLocation(`/operator/onboarding?tier=${tier}`);
    }
  };
  
  const confirmTierSwitch = () => {
    if (pendingTierSwitch) {
      switchTierMutation.mutate(pendingTierSwitch);
      setShowOnlineWarning(false);
      setPendingTierSwitch(null);
    }
  };
  
  const cancelTierSwitch = () => {
    setShowOnlineWarning(false);
    setShowActiveJobWarning(false);
    setPendingTierSwitch(null);
  };

  const handleUpgradeSubmit = (values: any) => {
    if (!selectedTier) return;
    addTierMutation.mutate({ tier: selectedTier, details: values });
  };

  if (!user?.operatorId) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-1.5 sm:gap-2"
            data-testid="button-tier-switcher"
          >
            <span className={TIER_INFO[viewTier as keyof typeof TIER_INFO].color}>
              {TIER_INFO[viewTier as keyof typeof TIER_INFO].badge}
            </span>
            <span className="inline md:hidden text-xs font-medium">
              {TIER_INFO[viewTier as keyof typeof TIER_INFO].shortLabel}
            </span>
            <span className="hidden md:inline">
              {TIER_INFO[viewTier as keyof typeof TIER_INFO].label}
            </span>
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Switch Tier</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {(["professional", "equipped", "manual"] as const).map((tier) => {
            const isSubscribed = subscribedTiers.includes(tier);
            const isOnline = tier === onlineTier; // Only show "Online" badge on the tier that is online
            const isCurrentView = tier === viewTier; // Check mark shows which dashboard is currently being viewed
            
            return (
              <DropdownMenuItem
                key={tier}
                onClick={() => handleTierClick(tier)}
                className={`flex items-center justify-between cursor-pointer ${
                  !isSubscribed ? "opacity-50 hover:opacity-70" : ""
                }`}
                disabled={!isSubscribed && false} // Keep clickable to show upgrade dialog
                data-testid={`menu-item-tier-${tier}`}
              >
                <div className="flex items-center gap-2">
                  <span className={!isSubscribed ? "grayscale" : ""}>{TIER_INFO[tier].badge}</span>
                  <span className={`${TIER_INFO[tier].color} ${!isSubscribed ? "text-gray-400 dark:text-gray-500" : ""}`}>
                    {TIER_INFO[tier].label}
                  </span>
                  {!isSubscribed && (
                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded ml-1">
                      Add Tier
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isCurrentView && isSubscribed && (
                    <Check className="w-4 h-4 text-blue-600" data-testid={`icon-current-view-${tier}`} />
                  )}
                  {isOnline && (
                    <span className="text-xs px-2 py-0.5 bg-green-600 text-white rounded font-semibold">
                      Online
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>
              Upgrade to {selectedTier && TIER_INFO[selectedTier].label}
            </DialogTitle>
            <DialogDescription>
              Please provide the required information to join this tier.
            </DialogDescription>
          </DialogHeader>

          {selectedTier === "manual" ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manual operators don't require additional equipment. You can start earning right away with basic tools like shovels and snow blowers.
              </p>
              <Button
                onClick={() => addTierMutation.mutate({ tier: "manual", details: {} })}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                data-testid="button-add-manual-tier"
              >
                Join Manual Tier
              </Button>
            </div>
          ) : selectedTier === "professional" ? (
            <Form {...professionalForm}>
              <form onSubmit={professionalForm.handleSubmit(handleUpgradeSubmit)} className="space-y-4">
                <FormField
                  control={professionalForm.control}
                  name="businessLicense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business License Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-business-license" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={professionalForm.control}
                  name="vehicle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 2023 Ford F-350" data-testid="input-vehicle" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={professionalForm.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-license-plate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={professionalForm.control}
                  name="services"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Services Offered</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="e.g., Snow Plowing, Towing, Hauling"
                          data-testid="input-services"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={addTierMutation.isPending}
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  data-testid="button-submit-tier-upgrade"
                >
                  {addTierMutation.isPending ? "Adding..." : "Join Professional & Certified"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...equippedForm}>
              <form onSubmit={equippedForm.handleSubmit(handleUpgradeSubmit)} className="space-y-4">
                <FormField
                  control={equippedForm.control}
                  name="vehicle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 2023 Ford F-350" data-testid="input-vehicle" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={equippedForm.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-license-plate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={equippedForm.control}
                  name="services"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Services Offered</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="e.g., Snow Plowing, Towing, Hauling"
                          data-testid="input-services"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={addTierMutation.isPending}
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  data-testid="button-submit-tier-upgrade"
                >
                  {addTierMutation.isPending ? "Adding..." : "Join Skilled & Equipped"}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Online Status Warning Dialog - Matches TierOnlineConfirmDialog styling */}
      <Dialog open={showOnlineWarning} onOpenChange={setShowOnlineWarning}>
        <DialogContent className="bg-white dark:bg-gray-900 max-w-md w-[calc(100%-2rem)] mx-auto">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-lg font-semibold text-center">
              Switch Dashboard?
            </DialogTitle>
            
            {onlineTier && pendingTierSwitch && (
              <div className="flex items-center justify-center gap-3 py-4 px-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <span className="text-2xl">{TIER_INFO[onlineTier].badge}</span>
                  <span className={`text-xs font-medium ${TIER_INFO[onlineTier].color} text-center truncate w-full`}>
                    {TIER_INFO[onlineTier].shortLabel}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-green-500 text-white rounded-full">
                    Online
                  </span>
                </div>
                
                <span className="text-gray-400 flex-shrink-0">→</span>
                
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <span className="text-2xl">{TIER_INFO[pendingTierSwitch].badge}</span>
                  <span className={`text-xs font-medium ${TIER_INFO[pendingTierSwitch].color} text-center truncate w-full`}>
                    {TIER_INFO[pendingTierSwitch].shortLabel}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-gray-400 text-white rounded-full">
                    Offline
                  </span>
                </div>
              </div>
            )}
            
            <DialogDescription className="text-center text-sm text-gray-600 dark:text-gray-400">
              Switching dashboards will take you offline. You'll need to go online again on the new dashboard to receive jobs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={cancelTierSwitch}
              className="flex-1 order-2 sm:order-1"
              data-testid="button-cancel-tier-switch"
            >
              Stay on {onlineTier ? TIER_INFO[onlineTier].shortLabel : 'Current'}
            </Button>
            <Button
              onClick={confirmTierSwitch}
              className="flex-1 order-1 sm:order-2 bg-teal-600 hover:bg-teal-700 text-white"
              data-testid="button-confirm-tier-switch"
            >
              Switch to {pendingTierSwitch ? TIER_INFO[pendingTierSwitch].shortLabel : 'New'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Job Warning Dialog */}
      <Dialog open={showActiveJobWarning} onOpenChange={setShowActiveJobWarning}>
        <DialogContent className="bg-white dark:bg-gray-900 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-lg">Active Job in Progress</DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              You have an active job that you're currently working on. Please complete or cancel your current job before switching to a different operator tier.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              onClick={cancelTierSwitch}
              className="w-full"
              data-testid="button-close-active-job-warning"
            >
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
