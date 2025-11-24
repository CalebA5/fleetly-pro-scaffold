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
import { ChevronDown, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Operator } from "@shared/schema";

const TIER_INFO = {
  professional: { label: "Professional & Certified", badge: "🏆", color: "text-amber-600" },
  equipped: { label: "Skilled & Equipped", badge: "🚛", color: "text-blue-600" },
  manual: { label: "Manual Operator", badge: "⛏️", color: "text-green-600" },
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

  const subscribedTiers = user?.subscribedTiers || [user?.activeTier || "professional"];
  
  // viewTier = which dashboard is being viewed (for dropdown button display)
  // activeTier = which tier is online (for online badge only)
  const viewTier = user?.viewTier || user?.activeTier || user?.operatorTier || "professional";
  
  // Fetch operator data to get which tier is actually online
  const { data: operatorData } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}`],
    enabled: !!user?.operatorId,
  });
  
  // Online badge shows which tier the operator is actively online with
  // Note: Switching tiers does NOT automatically make you online on the new tier
  // Operators must explicitly click "Go Online" on each tier's dashboard to go online
  const onlineTier = operatorData?.isOnline === 1 ? operatorData?.activeTier : null;

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
      
      // Navigate to the tier-specific dashboard (not business dashboard)
      // Business dashboard is only accessed via Drive & Earn menu
      if (newTier === 'manual') {
        setLocation('/manual-operator');
      } else if (newTier === 'equipped') {
        setLocation('/equipped-operator');
      } else {
        // Professional tier
        if (freshBusinessId) {
          // Business owners go to business dashboard for professional tier
          setLocation('/business');
        } else {
          // Individual professional operators go to /operator
          setLocation('/operator');
        }
      }
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
      
      // Navigate to the tier-specific dashboard (not business dashboard)
      // Business dashboard is only accessed via Drive & Earn menu
      if (variables.tier === 'manual') {
        setLocation('/manual-operator');
      } else if (variables.tier === 'equipped') {
        setLocation('/equipped-operator');
      } else {
        // Professional tier
        if (freshBusinessId) {
          // Business owners go to business dashboard for professional tier
          setLocation('/business');
        } else {
          // Individual professional operators go to /operator
          setLocation('/operator');
        }
      }
    },
  });

  const handleTierClick = (tier: "professional" | "equipped" | "manual") => {
    if (subscribedTiers.includes(tier)) {
      switchTierMutation.mutate(tier);
    } else {
      // Redirect to full onboarding flow instead of showing simple dialog
      setLocation(`/operator/onboarding?tier=${tier}`);
    }
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
            className="flex items-center gap-2"
            data-testid="button-tier-switcher"
          >
            <span className={TIER_INFO[viewTier as keyof typeof TIER_INFO].color}>
              {TIER_INFO[viewTier as keyof typeof TIER_INFO].badge}
            </span>
            <span className="hidden md:inline">
              {TIER_INFO[viewTier as keyof typeof TIER_INFO].label}
            </span>
            <ChevronDown className="w-4 h-4" />
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
    </>
  );
}
