import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Truck, FileText, Shield, CheckCircle, Award, Wrench, Users, Star, TrendingUp, UserCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { OPERATOR_TIER_INFO, type OperatorTier, type Operator } from "@shared/schema";
import { AuthDialog } from "@/components/AuthDialog";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const vehicleTypes = [
  "Pickup Truck",
  "Box Truck",
  "Flatbed Truck",
  "Semi Truck",
  "Tow Truck",
  "Snow Plow",
  "Cargo Van",
  "Other",
];

const manualEquipment = [
  "Snow Shovel",
  "Snow Blower",
  "Ice Scraper",
  "Salt Spreader",
  "Broom",
  "De-icing Tools",
];

const serviceTypes = [
  "Snow Plowing",
  "Towing",
  "Courier Services",
  "Long Distance Towing", 
  "Heavy Hauling",
  "Equipment Transport",
  "Emergency Services",
];

export const OperatorOnboarding = () => {
  const { toast } = useToast();
  const { user, isAuthenticated, updateUser, refetchUser } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTier, setSelectedTier] = useState<OperatorTier | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = tier selection
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch operator data if user has operatorId
  // Type for operator with tier stats
  type OperatorWithTierStats = Operator & {
    tierStats?: Record<string, {
      jobsCompleted: number;
      totalEarnings: string;
      rating: string;
      totalRatings: number;
      lastActiveAt: Date | null;
    }>;
  };

  const { data: operatorData, isLoading: isLoadingOperator } = useQuery<OperatorWithTierStats>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}`],
    enabled: !!user?.operatorId, // Only fetch if user has operatorId
  });
  
  const [formData, setFormData] = useState({
    // Common fields
    contactName: "",
    phone: "",
    email: "",
    address: "",
    
    // Professional tier
    businessName: "",
    licenseNumber: "",
    insuranceProvider: "",
    
    // Equipped & Professional
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    licensePlate: "",
    
    // Manual tier
    equipment: [] as string[],
    homeAddress: "",
    availableHours: "",
    
    // Services
    services: [] as string[],
    serviceArea: "",
    emergencyAvailable: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleEquipmentToggle = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const handleFileUpload = (type: string) => {
    toast({
      title: "File uploaded",
      description: `${type} document uploaded successfully`,
    });
  };

  const handleTierSelection = (tier: OperatorTier) => {
    // If user is already subscribed to this tier, redirect to dashboard
    if (operatorData?.subscribedTiers?.includes(tier)) {
      // Redirect to appropriate dashboard based on tier
      if (tier === "manual") {
        setLocation("/manual-operator");
      } else if (tier === "equipped") {
        setLocation("/equipped-operator");
      } else if (tier === "professional") {
        if (user?.businessId) {
          setLocation("/business");
        } else {
          setLocation("/operator");
        }
      }
      return;
    }
    
    // New tier - show onboarding form
    setSelectedTier(tier);
    setCurrentStep(1);
  };

  const nextStep = () => {
    const maxSteps = selectedTier === "manual" ? 3 : 4;
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 1) {
      setCurrentStep(0);
      setSelectedTier(null);
    }
  };

  const submitTierRegistration = async () => {
    if (!user || isSubmitting) return;
    
    // If user has operatorId, we need to wait for operator data to load
    if (user.operatorId && isLoadingOperator) {
      toast({
        title: "Loading...",
        description: "Please wait while we load your operator profile.",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if user is adding a tier to existing operator or creating new operator
      if (user.operatorId && operatorData) {
        // User already has operator profile - add new tier
        const response = await fetch(`/api/operators/${user.operatorId}/add-tier`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tier: selectedTier,
            details: formData
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Add tier failed:", errorData);
          throw new Error(errorData.message || "Failed to add tier");
        }

        // Refetch user from server first to get authoritative state
        await refetchUser();
        
        // Then update local state if needed
        updateUser({ 
          activeTier: selectedTier,
          operatorTier: selectedTier 
        });
        
        // Invalidate operator query to refetch with updated tiers
        queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user.operatorId}`] });
        
        toast({
          title: "Tier Added!",
          description: `You're now subscribed to ${OPERATOR_TIER_INFO[selectedTier!].label}. Start accepting jobs!`,
        });
        
        // Navigate to the new tier's dashboard
        const dashboardRoute = getDashboardRoute(selectedTier!);
        setTimeout(() => {
          setLocation(dashboardRoute);
        }, 1500);
      } else {
        // New operator - create operator profile
        const operatorId = `op-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        
        // Ensure services array is not empty (default to Snow Plowing)
        const services = formData.services.length > 0 ? formData.services : ["Snow Plowing"];
        
        // Prepare operator data based on tier
        const operatorData = {
          operatorId,
          name: formData.contactName || user.name,
          driverName: formData.contactName || user.name,
          rating: "5.00",
          totalJobs: 0,
          services,
          vehicle: formData.vehicleType || "Not specified",
          licensePlate: formData.licensePlate || "N/A",
          phone: formData.phone || "",
          email: formData.email || user.email,
          latitude: "0",
          longitude: "0",
          address: formData.address || formData.homeAddress || "",
          isOnline: 1,
          availability: "available",
          operatorTier: selectedTier || "professional",
          subscribedTiers: [selectedTier || "professional"],
          activeTier: selectedTier || "professional",
          isCertified: selectedTier === "professional" ? 1 : 0,
          businessLicense: formData.licenseNumber || null,
          businessName: formData.businessName || null,
          homeLatitude: null,
          homeLongitude: null,
          operatingRadius: null,
        };

        // Create operator record in database
        const response = await fetch("/api/operators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(operatorData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Operator creation failed:", errorData);
          throw new Error(errorData.message || "Failed to create operator profile");
        }

        const operator = await response.json();

        // Verify we got an operatorId back
        if (!operator.operatorId) {
          throw new Error("Operator created but no operatorId returned");
        }

        // Refetch user from server first to get authoritative state
        await refetchUser();
        
        // Then update local state to match
        updateUser({ 
          operatorId: operator.operatorId,
          operatorProfileComplete: true,
          operatorTier: selectedTier 
        });
        
        toast({
          title: "Profile Complete!",
          description: `Welcome to Fleetly as a ${OPERATOR_TIER_INFO[selectedTier!].label}. You can now start accepting jobs.`,
        });
        
        // Navigate to the appropriate dashboard
        const dashboardRoute = getDashboardRoute(selectedTier!);
        setTimeout(() => {
          setLocation(dashboardRoute);
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error in tier registration:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete tier registration. Please try again.",
        variant: "destructive",
      });
      // Don't redirect on error - let user retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show auth dialog with pre-filled name
      setShowAuthDialog(true);
      return;
    }
    
    // User is authenticated, proceed with registration
    submitTierRegistration();
  };

  const handleAuthSuccess = () => {
    // After successful auth, submit the tier registration
    submitTierRegistration();
  };

  const handleSkip = async () => {
    if (!user) return;
    
    try {
      // Generate a unique operatorId based on user email
      const operatorId = `op-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
      
      const tier = selectedTier || "professional";
      
      // Create minimal operator profile with required fields
      const operatorData = {
        operatorId,
        name: user.name,
        driverName: user.name,
        rating: "5.00",
        totalJobs: 0,
        services: ["Snow Plowing"], // Default service (required, can't be empty)
        vehicle: "Not specified",
        licensePlate: "N/A",
        phone: "",
        email: user.email,
        latitude: "0",
        longitude: "0",
        address: "",
        isOnline: 1,
        availability: "available",
        operatorTier: tier,
        subscribedTiers: [tier],
        activeTier: tier,
        isCertified: tier === "professional" ? 1 : 0,
        businessLicense: null,
        businessName: null,
        homeLatitude: null,
        homeLongitude: null,
        operatingRadius: null,
      };

      // Create operator record in database
      const response = await fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(operatorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Operator creation failed:", errorData);
        throw new Error(errorData.message || "Failed to create operator profile");
      }

      const operator = await response.json();

      // Verify we got an operatorId back
      if (!operator.operatorId) {
        throw new Error("Operator created but no operatorId returned");
      }

      // Update user with operatorId
      await updateUser({ 
        operatorId: operator.operatorId,
        operatorProfileComplete: true,
        operatorTier: tier
      });
      
      toast({
        title: "Welcome to Fleetly!",
        description: "You can complete your profile later from your dashboard.",
      });
      
      setLocation("/operator");
    } catch (error: any) {
      console.error("Error creating operator:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create operator profile. Please try again.",
        variant: "destructive",
      });
      // Don't redirect on error - let user retry
    }
  };

  // Tier-to-class mapping for fixed Tailwind classes
  const tierStyles: Record<OperatorTier, {
    bgGradient: string;
    ring: string;
    avatarBg: string;
    avatarBorder: string;
    iconBg: string;
    iconColor: string;
    icon: typeof Award;
    dashboardRoute: string;
  }> = {
    professional: {
      bgGradient: "bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20",
      ring: "ring-orange-500",
      avatarBg: "bg-orange-100 dark:bg-orange-900",
      avatarBorder: "border-orange-500",
      iconBg: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
      icon: Award,
      dashboardRoute: "/operator"
    },
    equipped: {
      bgGradient: "bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20",
      ring: "ring-blue-500",
      avatarBg: "bg-blue-100 dark:bg-blue-900",
      avatarBorder: "border-blue-500",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: Truck,
      dashboardRoute: "/equipped-operator"
    },
    manual: {
      bgGradient: "bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20",
      ring: "ring-green-500",
      avatarBg: "bg-green-100 dark:bg-green-900",
      avatarBorder: "border-green-500",
      iconBg: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
      icon: Users,
      dashboardRoute: "/manual-operator"
    }
  };

  // Helper function to get dashboard route based on tier
  const getDashboardRoute = (tier: OperatorTier) => {
    if (tier === "professional" && user?.businessId) {
      return "/business";
    }
    return tierStyles[tier].dashboardRoute;
  };

  // Helper function to render achievement badges
  const getAchievementBadges = (totalJobs: number, rating: string) => {
    const badges = [];
    if (parseFloat(rating) >= 4.9) {
      badges.push({ icon: Star, label: "Top Rated", color: "text-yellow-600" });
    }
    if (totalJobs >= 100) {
      badges.push({ icon: Award, label: "100+ Jobs", color: "text-purple-600" });
    } else if (totalJobs >= 50) {
      badges.push({ icon: TrendingUp, label: "50+ Jobs", color: "text-blue-600" });
    } else if (totalJobs >= 10) {
      badges.push({ icon: Sparkles, label: "10+ Jobs", color: "text-green-600" });
    }
    return badges;
  };

  // Helper function to render personalized tier card for subscribed tiers
  const renderSubscribedTierCard = (tier: OperatorTier) => {
    const isActive = operatorData?.activeTier === tier;
    
    // Get tier-specific stats
    const tierStats = operatorData?.tierStats?.[tier];
    const tierJobsCompleted = tierStats?.jobsCompleted || 0;
    const tierRating = tierStats?.rating || "0";
    const memberSince = operatorData?.createdAt ? format(new Date(operatorData.createdAt), "MMM yyyy") : "";
    
    // Use tier-specific stats for achievement badges
    const badges = getAchievementBadges(tierJobsCompleted, tierRating);
    const style = tierStyles[tier];
    const TierIcon = style.icon;
    
    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-2xl relative overflow-hidden group
          ${isActive ? `ring-2 ring-offset-2 ${style.ring}` : ''} 
          shadow-lg ${style.bgGradient}`}
        onClick={() => handleTierSelection(tier)}
        data-testid={`card-tier-${tier}`}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        
        {/* Operator avatar badge in top-right */}
        <div className={`absolute top-4 right-4 w-10 h-10 rounded-full ${style.avatarBg} flex items-center justify-center border-2 ${style.avatarBorder} shadow-lg`}>
          <UserCircle className={`w-6 h-6 ${style.iconColor}`} />
        </div>
        
        <CardHeader>
          <div className={`w-12 h-12 ${style.iconBg} rounded-full flex items-center justify-center mb-4`}>
            <TierIcon className={`w-6 h-6 ${style.iconColor}`} />
          </div>
          <CardTitle className="text-black dark:text-white flex items-center gap-2">
            {OPERATOR_TIER_INFO[tier].label}
            {isActive && (
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300 font-medium">
            Welcome back, {user?.name}! You've completed {tierJobsCompleted} jobs in this tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Display */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tier Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-black dark:text-white">
                  {parseFloat(tierRating).toFixed(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tier Jobs</span>
              <span className="font-semibold text-black dark:text-white">
                {tierJobsCompleted}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Member Since</span>
              <span className="font-semibold text-black dark:text-white">
                {memberSince}
              </span>
            </div>
          </div>

          {/* Achievement Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-xs border"
                >
                  {React.createElement(badge.icon, { className: `w-3 h-3 ${badge.color}` })}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{badge.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Go to Dashboard Button */}
          <Button 
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(getDashboardRoute(tier));
            }}
            data-testid={`button-goto-dashboard-${tier}`}
          >
            Go to Dashboard →
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Tier Selection Screen
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
        <header className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white">Drive & Earn</h1>
            <div className="w-20"></div>
          </div>
        </header>

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
                Choose Your Operator Type
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Select the tier that best matches your credentials and equipment. Each tier has different requirements and earning potential.
              </p>
            </div>

            {/* Tier Progress Indicator */}
            {operatorData && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tiers Unlocked:</span>
                <div className="flex gap-2">
                  {["professional", "equipped", "manual"].map((tier) => (
                    <div
                      key={tier}
                      className={`w-3 h-3 rounded-full ${
                        operatorData.subscribedTiers?.includes(tier)
                          ? "bg-orange-500"
                          : "bg-gray-300 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-black dark:text-white">
                  {operatorData.subscribedTiers?.length || 0}/3
                </span>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              {/* Professional Tier */}
              {operatorData?.subscribedTiers?.includes("professional") ? 
                renderSubscribedTierCard("professional")
                : (
                <Card 
                  className="cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-lg relative"
                  onClick={() => handleTierSelection("professional")}
                  data-testid="card-tier-professional"
                >
                  {operatorData && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                        + Add This Tier
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
                      <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-black dark:text-white">
                      {OPERATOR_TIER_INFO.professional.label}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {OPERATOR_TIER_INFO.professional.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        All services available
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        City-wide operation
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        1.5x pricing multiplier
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Premium customer access
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Requires: Business license, certification
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Equipped Tier */}
              {operatorData?.subscribedTiers?.includes("equipped") ? 
                renderSubscribedTierCard("equipped")
                : (
                <Card 
                  className="cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg relative"
                  onClick={() => handleTierSelection("equipped")}
                  data-testid="card-tier-equipped"
                >
                  {operatorData && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                        + Add This Tier
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                      <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-black dark:text-white">
                      {OPERATOR_TIER_INFO.equipped.label}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {OPERATOR_TIER_INFO.equipped.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Most services available
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        15km operation radius
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Standard pricing
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Flexible scheduling
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Requires: Vehicle/truck ownership
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manual Tier */}
              {operatorData?.subscribedTiers?.includes("manual") ? 
                renderSubscribedTierCard("manual")
                : (
                <Card 
                  className="cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-lg border-2 border-orange-200 dark:border-orange-800 relative"
                  onClick={() => handleTierSelection("manual")}
                  data-testid="card-tier-manual"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
                        {operatorData ? "+ Add This Tier" : "PLOW TO EARN"}
                      </span>
                    </div>
                    <CardTitle className="text-black dark:text-white">
                      {OPERATOR_TIER_INFO.manual.label}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {OPERATOR_TIER_INFO.manual.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Snow plowing focus
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        5km radius from home
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Easy to start earning
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Perfect for side income
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Requires: Basic snow equipment
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get steps based on tier
  const getSteps = () => {
    if (selectedTier === "professional") {
      return [
        { number: 1, title: "Business Info", icon: FileText },
        { number: 2, title: "Vehicle Details", icon: Truck },
        { number: 3, title: "Services & Area", icon: Shield },
        { number: 4, title: "Documents", icon: CheckCircle },
      ];
    } else if (selectedTier === "equipped") {
      return [
        { number: 1, title: "Contact Info", icon: FileText },
        { number: 2, title: "Vehicle Details", icon: Truck },
        { number: 3, title: "Services & Area", icon: Shield },
        { number: 4, title: "Complete", icon: CheckCircle },
      ];
    } else {
      return [
        { number: 1, title: "Contact Info", icon: FileText },
        { number: 2, title: "Equipment & Area", icon: Wrench },
        { number: 3, title: "Complete", icon: CheckCircle },
      ];
    }
  };

  const steps = getSteps();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col pb-16 md:pb-0">
      <header className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={prevStep}
            data-testid="button-back-step"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
              {OPERATOR_TIER_INFO[selectedTier!].badge} {OPERATOR_TIER_INFO[selectedTier!].label}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSkip}
            data-testid="button-skip"
          >
            Skip for Now
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center mb-2
                        ${isActive ? 'bg-orange-500 text-white' : ''}
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 dark:bg-gray-800 text-gray-500' : ''}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-medium ${isActive ? 'text-black dark:text-white' : 'text-gray-500'}`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black dark:text-white">
                {steps[currentStep - 1]?.title}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {selectedTier === "professional" && currentStep === 1 && "Enter your business information"}
                {selectedTier === "professional" && currentStep === 2 && "Tell us about your vehicle"}
                {selectedTier === "professional" && currentStep === 3 && "Select services and operating area"}
                {selectedTier === "professional" && currentStep === 4 && "Upload required documents"}
                {selectedTier === "equipped" && currentStep === 1 && "Enter your contact information"}
                {selectedTier === "equipped" && currentStep === 2 && "Tell us about your vehicle"}
                {selectedTier === "equipped" && currentStep === 3 && "Select services and operating area"}
                {selectedTier === "equipped" && currentStep === 4 && "Review and complete your profile"}
                {selectedTier === "manual" && currentStep === 1 && "Enter your contact information"}
                {selectedTier === "manual" && currentStep === 2 && "Select equipment and set your operating area"}
                {selectedTier === "manual" && currentStep === 3 && "Review and complete your profile"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Professional - Step 1: Business Info */}
              {selectedTier === "professional" && currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange("businessName", e.target.value)}
                      placeholder="ABC Towing & Hauling LLC"
                      data-testid="input-business-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseNumber">Business License Number *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                      placeholder="BL-123456"
                      data-testid="input-license-number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange("contactName", e.target.value)}
                      placeholder="John Smith"
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john@company.com"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Business Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="123 Main St, City, State ZIP"
                      data-testid="input-address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insuranceProvider">Insurance Provider *</Label>
                    <Input
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                      placeholder="State Farm, Geico, etc."
                      data-testid="input-insurance"
                    />
                  </div>
                </div>
              )}

              {/* Equipped/Manual - Step 1: Contact Info */}
              {(selectedTier === "equipped" || selectedTier === "manual") && currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contactName">Full Name *</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange("contactName", e.target.value)}
                      placeholder="John Smith"
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john@email.com"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">{selectedTier === "manual" ? "Home Address *" : "Address *"}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="123 Main St, City, State ZIP"
                      data-testid="input-address"
                    />
                    {selectedTier === "manual" && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        You can only accept jobs within {OPERATOR_TIER_INFO.manual.radiusKm}km of your home
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Professional/Equipped - Step 2: Vehicle Details */}
              {(selectedTier === "professional" || selectedTier === "equipped") && currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vehicleType">Vehicle Type *</Label>
                    <Select
                      value={formData.vehicleType}
                      onValueChange={(value) => handleInputChange("vehicleType", value)}
                    >
                      <SelectTrigger data-testid="select-vehicle-type">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="vehicleMake">Make *</Label>
                      <Input
                        id="vehicleMake"
                        value={formData.vehicleMake}
                        onChange={(e) => handleInputChange("vehicleMake", e.target.value)}
                        placeholder="Ford"
                        data-testid="input-vehicle-make"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Model *</Label>
                      <Input
                        id="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                        placeholder="F-350"
                        data-testid="input-vehicle-model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleYear">Year *</Label>
                      <Input
                        id="vehicleYear"
                        value={formData.vehicleYear}
                        onChange={(e) => handleInputChange("vehicleYear", e.target.value)}
                        placeholder="2023"
                        data-testid="input-vehicle-year"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="licensePlate">License Plate *</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                      placeholder="ABC-1234"
                      data-testid="input-license-plate"
                    />
                  </div>
                </div>
              )}

              {/* Manual - Step 2: Equipment & Area */}
              {selectedTier === "manual" && currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Your Equipment *</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                      Select all equipment you have available
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {manualEquipment.map((equipment) => (
                        <div 
                          key={equipment}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={equipment}
                            checked={formData.equipment.includes(equipment)}
                            onCheckedChange={() => handleEquipmentToggle(equipment)}
                            data-testid={`checkbox-equipment-${equipment.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <label
                            htmlFor={equipment}
                            className="text-sm text-black dark:text-white cursor-pointer"
                          >
                            {equipment}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="availableHours">Available Hours</Label>
                    <Input
                      id="availableHours"
                      value={formData.availableHours}
                      onChange={(e) => handleInputChange("availableHours", e.target.value)}
                      placeholder="e.g., Mornings, Evenings, Weekends"
                      data-testid="input-available-hours"
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-black dark:text-white mb-2">Operating Radius</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      As a manual operator, you can accept jobs within <strong>{OPERATOR_TIER_INFO.manual.radiusKm}km</strong> from your home address. This ensures efficient service delivery and prevents operator clashing in neighborhoods.
                    </p>
                  </div>
                </div>
              )}

              {/* Professional/Equipped - Step 3: Services */}
              {(selectedTier === "professional" || selectedTier === "equipped") && currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label>Services Offered *</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                      Select all services you can provide
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {serviceTypes.map((service) => (
                        <div 
                          key={service}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={service}
                            checked={formData.services.includes(service)}
                            onCheckedChange={() => handleServiceToggle(service)}
                            data-testid={`checkbox-service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <label
                            htmlFor={service}
                            className="text-sm text-black dark:text-white cursor-pointer"
                          >
                            {service}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="serviceArea">Service Area</Label>
                    <Textarea
                      id="serviceArea"
                      value={formData.serviceArea}
                      onChange={(e) => handleInputChange("serviceArea", e.target.value)}
                      placeholder="e.g., Manhattan, Queens, Brooklyn"
                      rows={3}
                      data-testid="input-service-area"
                    />
                    {selectedTier === "equipped" && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        You can operate within {OPERATOR_TIER_INFO.equipped.radiusKm}km from your location
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emergencyAvailable"
                      checked={formData.emergencyAvailable}
                      onCheckedChange={(checked) => handleInputChange("emergencyAvailable", !!checked)}
                      data-testid="checkbox-emergency"
                    />
                    <label
                      htmlFor="emergencyAvailable"
                      className="text-sm text-black dark:text-white cursor-pointer"
                    >
                      Available for emergency calls (24/7)
                    </label>
                  </div>
                </div>
              )}

              {/* Professional - Step 4: Documents */}
              {selectedTier === "professional" && currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-black dark:text-white mb-1">Business License</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Upload PDF or image</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload("Business License")}
                        data-testid="button-upload-license"
                      >
                        Upload
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-black dark:text-white mb-1">Insurance Certificate</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Upload PDF or image</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload("Insurance Certificate")}
                        data-testid="button-upload-insurance"
                      >
                        Upload
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-black dark:text-white mb-1">Vehicle Registration</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Upload PDF or image</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload("Vehicle Registration")}
                        data-testid="button-upload-registration"
                      >
                        Upload
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-black dark:text-white mb-1">Driver's License</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Upload PDF or image</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload("Driver's License")}
                        data-testid="button-upload-drivers-license"
                      >
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Completion screens */}
              {((selectedTier === "equipped" && currentStep === 4) || (selectedTier === "manual" && currentStep === 3)) && (
                <div className="space-y-6 text-center py-8">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black dark:text-white mb-2">
                      You're All Set!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your profile is complete. You can start accepting jobs right away.
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold text-black dark:text-white mb-3">Next Steps:</h4>
                    <ul className="space-y-2 text-sm text-left">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Browse available service requests</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Set your availability status</span>
                      </li>
                      {selectedTier === "manual" && (
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">Check customer grouping for nearby jobs</span>
                        </li>
                      )}
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Start earning with Fleetly!</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    data-testid="button-previous"
                  >
                    Previous
                  </Button>
                )}
                {currentStep === steps.length ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (user?.operatorId && isLoadingOperator)}
                    className="ml-auto bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-complete"
                  >
                    {isSubmitting ? "Processing..." : "Complete Profile"}
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    className="ml-auto bg-orange-500 hover:bg-orange-600 text-white"
                    data-testid="button-next"
                  >
                    Next Step
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Auth Dialog - shown when unauthenticated user tries to submit */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        defaultTab="signup"
        signupRole="operator"
        prefillName={formData.contactName}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};
