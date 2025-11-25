import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, Truck, FileText, Shield, CheckCircle, Award, Wrench, Users, Star, TrendingUp, UserCircle, Sparkles, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { OPERATOR_TIER_INFO, type OperatorTier, type Operator } from "@shared/schema";
import { AuthDialog } from "@/components/AuthDialog";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { geocodeAddress } from "@/lib/geocoding";

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

  // Read tier from URL parameter and auto-select it
  // If no tier is provided, redirect to Drive & Earn page to select one
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tierParam = params.get('tier') as OperatorTier | null;
    
    if (tierParam && ['professional', 'equipped', 'manual'].includes(tierParam)) {
      setSelectedTier(tierParam);
      setCurrentStep(1); // Skip tier selection, go straight to form
    } else {
      // No tier selected - redirect to Drive & Earn page
      setLocation('/drive-earn');
    }
  }, [setLocation]);
  
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

  // Define all available tiers in order
  const ALL_TIERS: OperatorTier[] = ["professional", "equipped", "manual"];

  // Hard-coded feature map for each tier (since OPERATOR_TIER_INFO doesn't include these)
  const tierFeatureMap: Record<OperatorTier, {
    features: string[];
    rateMultiplier: string;
    serviceRadius: string;
    requirements: string;
  }> = {
    professional: {
      features: [
        "All services available",
        "City-wide operation",
        "Premium customer access",
        "Priority job assignment"
      ],
      rateMultiplier: "1.5x",
      serviceRadius: "City-wide",
      requirements: "Business license, certification"
    },
    equipped: {
      features: [
        "Most services available",
        "15km operation radius",
        "Flexible scheduling",
        "Equipment discounts"
      ],
      rateMultiplier: "1.0x",
      serviceRadius: "15km radius",
      requirements: "Vehicle/truck ownership"
    },
    manual: {
      features: [
        "Snow plowing focus",
        "5km radius from home",
        "Easy to start earning",
        "Perfect for side income"
      ],
      rateMultiplier: "0.6x",
      serviceRadius: "5km from home",
      requirements: "Basic snow equipment"
    }
  };

  // Derive subscribed and available tiers with null guards
  const subscribedTierSet = new Set(operatorData?.subscribedTiers ?? []);
  const subscribedTiers = ALL_TIERS.filter(t => subscribedTierSet.has(t));
  const availableTiers = ALL_TIERS.filter(t => !subscribedTierSet.has(t));
  const hasSubscribedTiers = subscribedTiers.length > 0;
  
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
    // If user is already subscribed to this tier, redirect to unified dashboard
    if (operatorData?.subscribedTiers?.includes(tier)) {
      setLocation("/operator");
      return;
    }
    
    // New tier - show onboarding form
    setSelectedTier(tier);
    setCurrentStep(1);
  };

  // Per-step validation - validate before moving to next step
  const validateStep = async (): Promise<boolean> => {
    // Step 1: Contact/Business Info validation
    if (currentStep === 1) {
      if (selectedTier === "professional") {
        if (!formData.businessName?.trim()) {
          toast({ title: "Business Name Required", description: "Please enter your business name.", variant: "destructive" });
          return false;
        }
        if (!formData.licenseNumber?.trim()) {
          toast({ title: "License Number Required", description: "Please enter your business license number.", variant: "destructive" });
          return false;
        }
      }
      if (!formData.contactName?.trim()) {
        toast({ title: "Name Required", description: "Please enter your full name.", variant: "destructive" });
        return false;
      }
      if (!formData.phone?.trim()) {
        toast({ title: "Phone Required", description: "Please enter your phone number.", variant: "destructive" });
        return false;
      }
      if (!formData.email?.trim()) {
        toast({ title: "Email Required", description: "Please enter your email address.", variant: "destructive" });
        return false;
      }
      if (!formData.address?.trim() && !formData.homeAddress?.trim()) {
        toast({ title: "Address Required", description: "Please enter your address.", variant: "destructive" });
        return false;
      }
      
      // Validate address can be geocoded for manual/equipped tiers
      const addressToValidate = formData.homeAddress || formData.address || "";
      if ((selectedTier === "manual" || selectedTier === "equipped") && addressToValidate.trim()) {
        try {
          const geocoded = await geocodeAddress(addressToValidate);
          if (!geocoded) {
            toast({ 
              title: "Invalid Address", 
              description: "We couldn't verify this address. Please enter a valid street address, city, and state/province.",
              variant: "destructive" 
            });
            return false;
          }
        } catch (error) {
          toast({ 
            title: "Address Verification Failed", 
            description: "Unable to verify your address. Please check your connection and try again.",
            variant: "destructive" 
          });
          return false;
        }
      }
    }

    // Step 2: Vehicle Details validation (professional/equipped) or Equipment (manual)
    if (currentStep === 2) {
      if (selectedTier === "professional" || selectedTier === "equipped") {
        if (!formData.vehicleType?.trim()) {
          toast({ title: "Vehicle Type Required", description: "Please select your vehicle type.", variant: "destructive" });
          return false;
        }
        if (!formData.vehicleMake?.trim()) {
          toast({ title: "Vehicle Make Required", description: "Please enter your vehicle make.", variant: "destructive" });
          return false;
        }
        if (!formData.vehicleModel?.trim()) {
          toast({ title: "Vehicle Model Required", description: "Please enter your vehicle model.", variant: "destructive" });
          return false;
        }
        if (!formData.vehicleYear?.trim()) {
          toast({ title: "Vehicle Year Required", description: "Please enter your vehicle year.", variant: "destructive" });
          return false;
        }
        if (!formData.licensePlate?.trim()) {
          toast({ title: "License Plate Required", description: "Please enter your license plate number.", variant: "destructive" });
          return false;
        }
      }
      
      if (selectedTier === "manual") {
        if (formData.equipment.length === 0) {
          toast({ title: "Equipment Required", description: "Please select at least one piece of equipment you have.", variant: "destructive" });
          return false;
        }
        if (formData.services.length === 0) {
          toast({ title: "Services Required", description: "Please select at least one service you can provide.", variant: "destructive" });
          return false;
        }
      }
    }

    // Step 3: Services validation (professional/equipped)
    if (currentStep === 3 && (selectedTier === "professional" || selectedTier === "equipped")) {
      if (formData.services.length === 0) {
        toast({ title: "Services Required", description: "Please select at least one service you can offer.", variant: "destructive" });
        return false;
      }
    }

    return true;
  };

  const nextStep = async () => {
    const maxSteps = selectedTier === "manual" ? 3 : 4;
    
    // Validate current step before proceeding
    const isValid = await validateStep();
    if (!isValid) return;
    
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 1) {
      // Go back to Drive & Earn page instead of step 0
      setLocation('/drive-earn');
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
        // Geocode address if adding manual/equipped tier
        const requiresAddress = selectedTier === 'manual' || selectedTier === 'equipped';
        const addressToGeocode = formData.homeAddress || formData.address || "";
        
        if (requiresAddress && !addressToGeocode.trim()) {
          toast({
            title: "Address Required",
            description: `${selectedTier === 'manual' ? 'Manual' : 'Equipped'} operators must provide a home address for proximity-based job matching.`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        let homeLatitude: number | null = null;
        let homeLongitude: number | null = null;
        let latitude = "0";
        let longitude = "0";
        
        if (requiresAddress && addressToGeocode.trim()) {
          try {
            const geocoded = await geocodeAddress(addressToGeocode);
            if (geocoded) {
              latitude = geocoded.lat.toString();
              longitude = geocoded.lon.toString();
              homeLatitude = geocoded.lat;
              homeLongitude = geocoded.lon;
            } else {
              toast({
                title: "Invalid Address",
                description: "We couldn't locate the address you provided. Please enter a valid street address, city, and state.",
                variant: "destructive",
              });
              setIsSubmitting(false);
              return;
            }
          } catch (error) {
            console.error("Geocoding failed:", error);
            toast({
              title: "Geocoding Failed",
              description: "We couldn't verify your address location. Please check your internet connection and try again.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }
        
        const response = await fetch(`/api/operators/${user.operatorId}/add-tier`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tier: selectedTier,
            details: formData,
            homeLatitude,
            homeLongitude,
            latitude,
            longitude,
            operatingRadius: selectedTier === 'manual' ? 5 : selectedTier === 'equipped' ? 15 : null
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Add tier failed:", errorData);
          throw new Error(errorData.message || "Failed to add tier");
        }

        // Refetch user from server to get authoritative state with all tier data
        await refetchUser();
        
        // Invalidate operator query to refetch with updated tiers
        queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user.operatorId}`] });
        
        toast({
          title: "Tier Added!",
          description: `You're now subscribed to ${OPERATOR_TIER_INFO[selectedTier!].label}. Start accepting jobs!`,
        });
        
        // Navigate to the unified operator dashboard
        setTimeout(() => {
          setLocation(getDashboardRoute());
        }, 1500);
      } else {
        // New operator - create operator profile
        const operatorId = `op-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        
        // Ensure services array is not empty (default to Snow Plowing)
        const services = formData.services.length > 0 ? formData.services : ["Snow Plowing"];
        
        // Validate address is provided for tiers requiring proximity filtering
        const addressToGeocode = formData.homeAddress || formData.address || "";
        const requiresAddress = selectedTier === 'manual' || selectedTier === 'equipped';
        
        if (requiresAddress && !addressToGeocode.trim()) {
          toast({
            title: "Address Required",
            description: `${selectedTier === 'manual' ? 'Manual' : 'Equipped'} operators must provide a home address for proximity-based job matching.`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        // Geocode operator's address to get coordinates
        let latitude = "0";
        let longitude = "0";
        let homeLatitude: number | null = null;
        let homeLongitude: number | null = null;
        
        if (addressToGeocode.trim()) {
          try {
            const geocoded = await geocodeAddress(addressToGeocode);
            if (geocoded) {
              latitude = geocoded.lat.toString();
              longitude = geocoded.lon.toString();
              homeLatitude = geocoded.lat;
              homeLongitude = geocoded.lon;
            } else {
              // Geocoding returned no results
              if (requiresAddress) {
                toast({
                  title: "Invalid Address",
                  description: "We couldn't locate the address you provided. Please enter a valid street address, city, and state.",
                  variant: "destructive",
                });
                setIsSubmitting(false);
                return;
              }
              console.warn("Geocoding returned no results for:", addressToGeocode);
            }
          } catch (error) {
            console.error("Geocoding failed:", error);
            // Only block submission if address is required for proximity filtering
            if (requiresAddress) {
              toast({
                title: "Geocoding Failed",
                description: "We couldn't verify your address location. Please check your internet connection and try again.",
                variant: "destructive",
              });
              setIsSubmitting(false);
              return;
            }
          }
        }
        
        // Set operating radius based on tier
        const operatingRadius = selectedTier === 'manual' ? 5 : selectedTier === 'equipped' ? 15 : null;
        
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
          latitude,
          longitude,
          address: formData.address || formData.homeAddress || "",
          isOnline: 0, // FIXED: Operators start offline by default - must manually go online
          availability: "available",
          operatorTier: selectedTier || "professional",
          subscribedTiers: [selectedTier || "professional"],
          activeTier: null, // FIXED: Null until operator goes online
          viewTier: selectedTier || "professional",
          isCertified: selectedTier === "professional" ? 1 : 0,
          businessLicense: formData.licenseNumber || null,
          businessName: formData.businessName || null,
          homeLatitude,
          homeLongitude,
          operatingRadius,
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

        // If professional tier, create a business record
        let businessId: string | null = null;
        if (selectedTier === "professional") {
          businessId = `BUS-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
          
          const businessData = {
            businessId,
            name: formData.businessName || `${user.name}'s Business`,
            email: formData.email || user.email,
            phone: formData.phone || "",
            businessLicense: formData.licenseNumber || "",
            address: formData.address || "",
            city: "",
            state: "",
            zipCode: "",
          };

          const businessResponse = await fetch("/api/business", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(businessData),
          });

          if (!businessResponse.ok) {
            console.error("Business creation failed, but operator was created");
            // Don't throw error - operator is created, just log the failure
          } else {
            // Update operator with businessId
            await fetch(`/api/operators/${operator.operatorId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ businessId }),
            });
          }
        }

        // Refetch user from server first to get authoritative state
        await refetchUser();
        
        // Then update local state to match
        updateUser({ 
          operatorId: operator.operatorId,
          operatorProfileComplete: true,
          operatorTier: selectedTier,
          businessId: businessId || undefined
        });
        
        // Invalidate operator queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${operator.operatorId}`] });
        
        toast({
          title: "Profile Complete!",
          description: `Welcome to Fleetly as a ${OPERATOR_TIER_INFO[selectedTier!].label}. You can now start accepting jobs.`,
        });
        
        // Navigate to the unified operator dashboard
        setTimeout(() => {
          setLocation(getDashboardRoute());
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
  }> = {
    professional: {
      bgGradient: "bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20",
      ring: "ring-orange-500",
      avatarBg: "bg-orange-100 dark:bg-orange-900",
      avatarBorder: "border-orange-500",
      iconBg: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
      icon: Award,
    },
    equipped: {
      bgGradient: "bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20",
      ring: "ring-blue-500",
      avatarBg: "bg-blue-100 dark:bg-blue-900",
      avatarBorder: "border-blue-500",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: Truck,
    },
    manual: {
      bgGradient: "bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20",
      ring: "ring-green-500",
      avatarBg: "bg-green-100 dark:bg-green-900",
      avatarBorder: "border-green-500",
      iconBg: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
      icon: Users,
    }
  };

  // All tiers use the unified operator dashboard
  const getDashboardRoute = () => "/operator";

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
              setLocation(getDashboardRoute());
            }}
            data-testid={`button-goto-dashboard-${tier}`}
          >
            Go to Dashboard →
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Helper function to render available tier cards (not yet subscribed)
  const renderAvailableTierCard = (tier: OperatorTier) => {
    const style = tierStyles[tier];
    const TierIcon = style.icon;
    const info = OPERATOR_TIER_INFO[tier];
    const features = tierFeatureMap[tier];
    
    return (
      <Card 
        className="cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-lg relative"
        onClick={() => handleTierSelection(tier)}
        data-testid={`card-tier-${tier}`}
      >
        {/* "+ Add This Tier" badge in top-right */}
        <div className="absolute top-4 right-4">
          <span className={`text-xs font-semibold ${style.iconColor} ${style.avatarBg} px-2 py-1 rounded`}>
            + Add This Tier
          </span>
        </div>
        
        <CardHeader>
          <div className={`w-12 h-12 ${style.iconBg} rounded-full flex items-center justify-center mb-4`}>
            <TierIcon className={`w-6 h-6 ${style.iconColor}`} />
          </div>
          <CardTitle className="text-black dark:text-white">
            {info.label}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {info.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Features List */}
          <div className="space-y-2">
            {features.features.map((feature, idx) => (
              <div key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                {feature}
              </div>
            ))}
          </div>
          
          {/* Rate & Radius Info - commented out for now to match published version */}
          {/* <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Rate Multiplier</span>
              <span className="font-semibold text-black dark:text-white">{features.rateMultiplier}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Service Radius</span>
              <span className="font-semibold text-black dark:text-white">{features.serviceRadius}</span>
            </div>
          </div> */}
          
          {/* Requirements */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Requires: {features.requirements}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // REMOVED: Tier Selection Screen (Step 0)
  // Tier selection is now handled by the NEW Drive & Earn page (/drive-earn)
  // Users are redirected to /drive-earn if they try to access onboarding without a tier parameter
  // This eliminates confusion and consolidates all tier selection in one place

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

  // Show loading state while waiting for tier from URL param or redirect
  // This prevents crash when selectedTier is null on initial render
  if (!selectedTier) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

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

              {/* Manual - Step 2: Equipment, Services & Area */}
              {selectedTier === "manual" && currentStep === 2 && (
                <div className="space-y-6">
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
                            variant="circular"
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
                    <Label>Services You'll Provide *</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                      Select all services you can offer
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {serviceTypes.map((service) => (
                        <div 
                          key={service}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            variant="circular"
                            id={`manual-${service}`}
                            checked={formData.services.includes(service)}
                            onCheckedChange={() => handleServiceToggle(service)}
                            data-testid={`checkbox-service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <label
                            htmlFor={`manual-${service}`}
                            className="text-sm text-black dark:text-white cursor-pointer"
                          >
                            {service}
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
                  
                  <div>
                    <Label>Equipment Photos (Optional)</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                      Upload photos of your equipment to help verify your application
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-black dark:text-white mb-1">Equipment Photo 1</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Upload image (JPG, PNG)</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload("Equipment Photo 1")}
                          data-testid="button-upload-equipment-1"
                        >
                          Upload
                        </Button>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-black dark:text-white mb-1">Equipment Photo 2</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Upload image (JPG, PNG)</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload("Equipment Photo 2")}
                          data-testid="button-upload-equipment-2"
                        >
                          Upload
                        </Button>
                      </div>
                    </div>
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
                            variant="circular"
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
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex-1">
                      <label
                        htmlFor="emergencyAvailable"
                        className="text-sm font-medium text-black dark:text-white cursor-pointer"
                      >
                        Available for emergency calls (24/7)
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Enable to receive urgent requests at any time
                      </p>
                    </div>
                    <Switch
                      id="emergencyAvailable"
                      checked={formData.emergencyAvailable}
                      onCheckedChange={(checked) => handleInputChange("emergencyAvailable", checked)}
                      data-testid="switch-emergency"
                    />
                  </div>
                </div>
              )}

              {/* Professional - Step 4: Documents (Optional) */}
              {selectedTier === "professional" && currentStep === 4 && (
                <div className="space-y-6">
                  {/* Info banner about optional documents */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Documents are optional for now
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        You can complete your profile and access your dashboard. However, you'll need to upload and verify your documents before you can go online and accept jobs.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
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
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
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
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
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
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
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
                      Profile Complete!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You now have access to your dashboard. Complete verification to start accepting jobs.
                    </p>
                  </div>
                  
                  {/* Verification Notice */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 max-w-md mx-auto text-left">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Document verification required
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Upload your documents from the dashboard. Once verified, you can go online and accept jobs.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold text-black dark:text-white mb-3">Next Steps:</h4>
                    <ul className="space-y-2 text-sm text-left">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Access your operator dashboard</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Upload required documents for verification</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">Once verified, go online and start earning!</span>
                      </li>
                      {selectedTier === "manual" && (
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">Check customer grouping for nearby jobs</span>
                        </li>
                      )}
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
