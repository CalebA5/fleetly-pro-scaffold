import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Briefcase, Truck, Package, MapPin, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Operator, OperatorTierProfile } from "@shared/schema";
import { OPERATOR_TIER_INFO } from "@shared/schema";
import { Link } from "wouter";

export const EditTierInfo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, routeParams] = useRoute<{ tier: string }>("/profile/tier/:tier");
  const tier = routeParams?.tier as "professional" | "equipped" | "manual" | undefined;
  
  const urlParams = new URLSearchParams(window.location.search);
  const fromRoute = urlParams.get("from") || "/profile";

  const tierInfo = tier ? OPERATOR_TIER_INFO[tier] : null;

  const [formData, setFormData] = useState({
    businessName: "",
    businessLicense: "",
    vehicle: "",
    licensePlate: "",
  });

  const { data: operatorData, isLoading } = useQuery<Operator>({
    queryKey: user?.operatorId ? [`/api/operators/by-id/${user.operatorId}`] : [],
    enabled: !!user?.operatorId,
  });

  const tierProfiles: OperatorTierProfile[] = Array.isArray(operatorData?.operatorTierProfiles) 
    ? operatorData.operatorTierProfiles 
    : [];
  const tierProfile = tierProfiles.find(p => p.tier === tier);

  useEffect(() => {
    if (tierProfile) {
      setFormData({
        businessName: tierProfile.businessName || "",
        businessLicense: tierProfile.businessLicense || "",
        vehicle: tierProfile.vehicle || "",
        licensePlate: tierProfile.licensePlate || "",
      });
    }
  }, [tierProfile]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest(`/api/operators/${user?.operatorId}/tier-profile/${tier}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user?.operatorId}`] });
      toast({
        title: "Tier Info Updated",
        description: `Your ${tierInfo?.label} tier information has been saved.`,
      });
      navigate(fromRoute);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tier information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    navigate(fromRoute);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (!tier || !tierInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-muted-foreground">Invalid tier specified</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user?.operatorId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-muted-foreground">You are not registered as an operator</p>
      </div>
    );
  }

  const isSubscribed = operatorData?.subscribedTiers?.includes(tier);

  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-3 -ml-2" 
              data-testid="button-back" 
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Not Registered for {tierInfo.label}</h2>
              <p className="text-sm text-gray-500 mb-4">
                You need to complete onboarding for this tier first.
              </p>
              <Link href={`/operator/onboarding?tier=${tier}`}>
                <Button data-testid="button-complete-onboarding">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Complete {tierInfo.label} Onboarding
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 max-w-lg">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-3 -ml-2" 
            data-testid="button-back" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tierInfo.badge}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                Edit {tierInfo.label}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update your tier-specific information
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(tier === "professional" || tier === "equipped") && (
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Enter business name"
                    data-testid="input-business-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessLicense">Business License</Label>
                  <Input
                    id="businessLicense"
                    value={formData.businessLicense}
                    onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                    placeholder="Enter license number"
                    data-testid="input-business-license"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {(tier === "professional" || tier === "equipped") && (
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-400" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle Details</Label>
                  <Input
                    id="vehicle"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    placeholder="e.g., 2022 Ford F-350"
                    data-testid="input-vehicle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License Plate</Label>
                  <Input
                    id="licensePlate"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    placeholder="Enter license plate"
                    data-testid="input-license-plate"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {tierInfo.radiusKm && (
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Operating Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your operating radius is set to <span className="font-semibold text-gray-900 dark:text-white">{tierInfo.radiusKm}km</span> from your home location.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This cannot be changed as it's determined by your tier level.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {tierProfile?.services && tierProfile.services.length > 0 && (
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  Services Offered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tierProfile.services.map((service, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  To update services, please complete onboarding again or contact support.
                </p>
              </CardContent>
            </Card>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={updateMutation.isPending}
            data-testid="button-save"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
