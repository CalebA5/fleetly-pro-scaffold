import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight,
  Upload, 
  Truck, 
  FileText, 
  Shield, 
  CheckCircle, 
  Wrench, 
  MapPin,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  Clock,
  Zap,
  AlertCircle,
  Sparkles,
  Camera,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { OPERATOR_TIER_INFO, SERVICE_AREA_LIMITS, type OperatorTier, type Operator } from "@shared/schema";
import { AuthDialog } from "@/components/AuthDialog";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { geocodeAddress } from "@/lib/geocoding";
import { getServicesForTier } from "@shared/tierCapabilities";
import { cn } from "@/lib/utils";

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

// Types for location data
type Country = {
  isoCode: string;
  name: string;
  flag?: string;
};

type StateProvince = {
  isoCode: string;
  name: string;
  countryCode: string;
};

type City = {
  name: string;
  stateCode: string;
  countryCode: string;
  latitude?: string;
  longitude?: string;
};

type SelectedCity = {
  cityName: string;
  stateCode: string;
  stateName: string;
  countryCode: string;
  countryName: string;
  isPrimary?: boolean;
};

export const OperatorOnboarding = () => {
  const { toast } = useToast();
  const { user, refetchUser } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTier, setSelectedTier] = useState<OperatorTier | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location state
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateProvince[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCities, setSelectedCities] = useState<SelectedCity[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Contact/Business Info
    businessName: "",
    licenseNumber: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    homeAddress: "",
    insuranceProvider: "",
    
    // Vehicle Details
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    licensePlate: "",
    
    // Services
    services: [] as string[],
    serviceArea: "",
    emergencyAvailable: false,
    
    // Equipment (Manual tier)
    equipment: [] as string[],
    availableHours: "",
  });

  // Read tier from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tierParam = params.get('tier') as OperatorTier | null;
    
    if (tierParam && ['professional', 'equipped', 'manual'].includes(tierParam)) {
      setSelectedTier(tierParam);
      setCurrentStep(1);
    } else {
      setLocation('/drive-earn');
    }
  }, [setLocation]);

  // Fetch operator data if user has operatorId
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
    enabled: !!user?.operatorId,
  });

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch('/api/locations/countries');
        const data = await response.json();
        setCountries(data);
      } catch (error) {
        console.error('Failed to load countries:', error);
      }
    };
    loadCountries();
  }, []);

  // Load states when country changes
  useEffect(() => {
    const loadStates = async () => {
      if (!selectedCountry) {
        setStates([]);
        return;
      }
      setIsLoadingLocations(true);
      try {
        const response = await fetch(`/api/locations/states/${selectedCountry}`);
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error('Failed to load states:', error);
      }
      setIsLoadingLocations(false);
    };
    loadStates();
    setSelectedState("");
    setCities([]);
  }, [selectedCountry]);

  // Load cities when state changes
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedCountry || !selectedState) {
        setCities([]);
        return;
      }
      setIsLoadingLocations(true);
      try {
        const response = await fetch(`/api/locations/cities/${selectedCountry}/${selectedState}`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
      setIsLoadingLocations(false);
    };
    loadCities();
  }, [selectedCountry, selectedState]);

  // Get step configuration based on tier
  const getSteps = () => {
    if (selectedTier === "professional") {
      return [
        { number: 1, title: "Business Info", subtitle: "Your company details", icon: Building2 },
        { number: 2, title: "Service Area", subtitle: "Where you operate", icon: MapPin },
        { number: 3, title: "Vehicle", subtitle: "Your equipment", icon: Truck },
        { number: 4, title: "Documents", subtitle: "Verification", icon: FileText },
      ];
    } else if (selectedTier === "equipped") {
      return [
        { number: 1, title: "Contact Info", subtitle: "Your details", icon: User },
        { number: 2, title: "Service Area", subtitle: "Where you operate", icon: MapPin },
        { number: 3, title: "Vehicle", subtitle: "Your equipment", icon: Truck },
        { number: 4, title: "Complete", subtitle: "You're ready!", icon: CheckCircle },
      ];
    } else {
      return [
        { number: 1, title: "Contact Info", subtitle: "Your details", icon: User },
        { number: 2, title: "Services", subtitle: "What you offer", icon: Shield },
        { number: 3, title: "Equipment", subtitle: "Your tools", icon: Wrench },
        { number: 4, title: "Complete", subtitle: "You're ready!", icon: CheckCircle },
      ];
    }
  };

  const steps = getSteps();
  const totalSteps = steps.length;

  // Input handlers
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

  // City selection handler with tier-based constraints
  const handleCitySelect = (cityName: string) => {
    const country = countries.find(c => c.isoCode === selectedCountry);
    const state = states.find(s => s.isoCode === selectedState);
    const city = cities.find(c => c.name === cityName);
    
    if (!country || !state || !city) return;

    // Get tier-specific limits
    const limits = SERVICE_AREA_LIMITS[selectedTier!];
    
    // Check max cities limit
    if (limits.maxCities && selectedCities.length >= limits.maxCities) {
      toast({
        title: "City limit reached",
        description: `${OPERATOR_TIER_INFO[selectedTier!].label} operators can select up to ${limits.maxCities} city(s).`,
        variant: "destructive",
      });
      return;
    }

    // Enforce same province/state restriction for tiers that require it
    if (limits.requireSameProvince && selectedCities.length > 0) {
      const firstCity = selectedCities[0];
      if (firstCity.stateCode !== selectedState || firstCity.countryCode !== selectedCountry) {
        toast({
          title: "Same province required",
          description: `${OPERATOR_TIER_INFO[selectedTier!].label} operators can only select cities within the same province/state.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Check if already selected
    if (selectedCities.some(c => c.cityName === cityName && c.stateCode === selectedState)) {
      return;
    }

    const newCity: SelectedCity = {
      cityName,
      stateCode: selectedState,
      stateName: state.name,
      countryCode: selectedCountry,
      countryName: country.name,
      isPrimary: selectedCities.length === 0,
    };

    setSelectedCities(prev => [...prev, newCity]);
  };

  const handleRemoveCity = (cityName: string, stateCode: string) => {
    setSelectedCities(prev => {
      const filtered = prev.filter(c => !(c.cityName === cityName && c.stateCode === stateCode));
      // If we removed the primary, make the first remaining one primary
      if (filtered.length > 0 && !filtered.some(c => c.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  // Step validation
  const validateStep = async (): Promise<boolean> => {
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
    }

    if (currentStep === 2) {
      if (selectedTier === "manual") {
        if (formData.services.length === 0) {
          toast({ title: "Services Required", description: "Please select at least one service.", variant: "destructive" });
          return false;
        }
      } else {
        // Professional/Equipped - service area validation
        if (selectedCities.length === 0) {
          toast({ title: "Service Area Required", description: "Please select at least one city where you operate.", variant: "destructive" });
          return false;
        }
        if (formData.services.length === 0) {
          toast({ title: "Services Required", description: "Please select at least one service.", variant: "destructive" });
          return false;
        }
      }
    }

    if (currentStep === 3) {
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
      }
      if (selectedTier === "manual") {
        if (formData.equipment.length === 0) {
          toast({ title: "Equipment Required", description: "Please select at least one piece of equipment.", variant: "destructive" });
          return false;
        }
      }
    }

    return true;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (!isValid) return;
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation('/drive-earn');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Geocode address
      const addressToGeocode = formData.homeAddress || formData.address || "";
      let homeLatitude = null;
      let homeLongitude = null;
      
      if (addressToGeocode.trim()) {
        const geocoded = await geocodeAddress(addressToGeocode);
        if (geocoded) {
          homeLatitude = geocoded.lat;
          homeLongitude = geocoded.lon;
        }
      }

      // Prepare service areas from selected cities
      const serviceAreas = selectedCities.map(city => ({
        countryCode: city.countryCode,
        countryName: city.countryName,
        stateCode: city.stateCode,
        stateName: city.stateName,
        cityName: city.cityName,
        isPrimary: city.isPrimary,
      }));

      // Submit registration
      if (user.operatorId && operatorData) {
        // Adding new tier
        const response = await fetch(`/api/operators/${user.operatorId}/add-tier`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tier: selectedTier,
            details: formData,
            serviceAreas,
            homeLatitude,
            homeLongitude,
            operatingRadius: selectedTier === 'manual' ? 5 : selectedTier === 'equipped' ? 15 : null
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add tier");
        }
      } else {
        // New operator registration
        const response = await fetch("/api/operators/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tier: selectedTier,
            details: formData,
            serviceAreas,
            homeLatitude,
            homeLongitude,
            operatingRadius: selectedTier === 'manual' ? 5 : selectedTier === 'equipped' ? 15 : null
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to register");
        }
      }

      await refetchUser();
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user.operatorId}`] });

      toast({
        title: "Registration Complete!",
        description: `Welcome to Fleetly as a ${OPERATOR_TIER_INFO[selectedTier!].label}!`,
      });

      setTimeout(() => {
        setLocation(`/operator?tier=${selectedTier}`);
      }, 1500);

    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    handleSubmit();
  };

  // Loading state
  if (!selectedTier) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const tierInfo = OPERATOR_TIER_INFO[selectedTier];
  const tierLimits = SERVICE_AREA_LIMITS[selectedTier];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950">
      {/* Premium Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "px-3 py-1 text-sm font-semibold",
                  selectedTier === "professional" && "border-purple-500 text-purple-600 dark:text-purple-400",
                  selectedTier === "equipped" && "border-blue-500 text-blue-600 dark:text-blue-400",
                  selectedTier === "manual" && "border-green-500 text-green-600 dark:text-green-400"
                )}
              >
                {tierInfo.badge} {tierInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-800" />
          <div 
            className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
          
          {/* Step Indicators */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              
              return (
                <div key={step.number} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10",
                      isCompleted && "bg-orange-500 text-white shadow-lg shadow-orange-500/30",
                      isCurrent && "bg-white dark:bg-gray-900 border-2 border-orange-500 text-orange-500 shadow-lg",
                      !isCompleted && !isCurrent && "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p className={cn(
                      "text-sm font-semibold",
                      (isCompleted || isCurrent) ? "text-black dark:text-white" : "text-gray-400"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 pb-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                selectedTier === "professional" && "bg-purple-100 dark:bg-purple-900/30",
                selectedTier === "equipped" && "bg-blue-100 dark:bg-blue-900/30",
                selectedTier === "manual" && "bg-green-100 dark:bg-green-900/30"
              )}>
                {(() => {
                  const CurrentIcon = steps[currentStep - 1]?.icon || User;
                  return <CurrentIcon className={cn(
                    "w-6 h-6",
                    selectedTier === "professional" && "text-purple-600 dark:text-purple-400",
                    selectedTier === "equipped" && "text-blue-600 dark:text-blue-400",
                    selectedTier === "manual" && "text-green-600 dark:text-green-400"
                  )} />;
                })()}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-black dark:text-white">
                  {steps[currentStep - 1]?.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                  Step {currentStep} of {totalSteps}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Step 1: Contact/Business Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {selectedTier === "professional" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        Business Name *
                      </Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange("businessName", e.target.value)}
                        placeholder="Your Company Name"
                        className="h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        data-testid="input-business-name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber" className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        Business License Number *
                      </Label>
                      <Input
                        id="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                        placeholder="LIC-123456"
                        className="h-12 rounded-xl border-gray-200 dark:border-gray-700"
                        data-testid="input-license-number"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Full Name *
                  </Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    placeholder="John Smith"
                    className="h-12 rounded-xl border-gray-200 dark:border-gray-700"
                    data-testid="input-contact-name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      Phone *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      className="h-12 rounded-xl border-gray-200 dark:border-gray-700"
                      data-testid="input-phone"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="john@email.com"
                      className="h-12 rounded-xl border-gray-200 dark:border-gray-700"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {selectedTier === "manual" ? "Home Address *" : "Business Address *"}
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="123 Main St, City, State ZIP"
                    className="h-12 rounded-xl border-gray-200 dark:border-gray-700"
                    data-testid="input-address"
                  />
                  {selectedTier === "manual" && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      Jobs will be matched within {OPERATOR_TIER_INFO.manual.radiusKm}km of your home
                    </p>
                  )}
                </div>

                {selectedTier === "professional" && (
                  <div className="space-y-2">
                    <Label htmlFor="insuranceProvider" className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      Insurance Provider *
                    </Label>
                    <Input
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                      placeholder="State Farm, Geico, etc."
                      className="h-12 rounded-xl border-gray-200 dark:border-gray-700"
                      data-testid="input-insurance"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Service Area (Professional/Equipped) or Services (Manual) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {selectedTier === "manual" ? (
                  // Manual tier - Services selection only
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-black dark:text-white">Services You Offer *</Label>
                        <p className="text-sm text-gray-500 mt-1">Select the services you can provide</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {serviceTypes.map((service) => (
                          <div
                            key={service}
                            onClick={() => handleServiceToggle(service)}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                              formData.services.includes(service)
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                            data-testid={`service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Checkbox
                              variant="circular"
                              checked={formData.services.includes(service)}
                              className="pointer-events-none"
                            />
                            <span className="text-sm font-medium text-black dark:text-white">{service}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-semibold text-black dark:text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-500" />
                          Emergency Availability
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">Accept urgent requests 24/7</p>
                      </div>
                      <Switch
                        checked={formData.emergencyAvailable}
                        onCheckedChange={(checked) => handleInputChange("emergencyAvailable", checked)}
                        data-testid="switch-emergency"
                      />
                    </div>
                  </>
                ) : (
                  // Professional/Equipped - Service Area selection
                  <>
                    {/* Tier limits info */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100">
                            {tierInfo.label} Coverage
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            {tierLimits.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Location Selectors */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-black dark:text-white">Country *</Label>
                          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                            <SelectTrigger className="h-12 rounded-xl" data-testid="select-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.isoCode} value={country.isoCode}>
                                  {country.flag} {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-black dark:text-white">Province/State *</Label>
                          <Select 
                            value={selectedState} 
                            onValueChange={setSelectedState}
                            disabled={!selectedCountry}
                          >
                            <SelectTrigger className="h-12 rounded-xl" data-testid="select-state">
                              <SelectValue placeholder={selectedCountry ? "Select state" : "Select country first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.isoCode} value={state.isoCode}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-black dark:text-white">City *</Label>
                        <Select 
                          value=""
                          onValueChange={handleCitySelect}
                          disabled={!selectedState || isLoadingLocations}
                        >
                          <SelectTrigger className="h-12 rounded-xl" data-testid="select-city">
                            <SelectValue placeholder={
                              isLoadingLocations ? "Loading cities..." :
                              !selectedState ? "Select state first" :
                              "Select city to add"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem 
                                key={city.name} 
                                value={city.name}
                                disabled={selectedCities.some(c => c.cityName === city.name && c.stateCode === selectedState)}
                              >
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Selected Cities */}
                      {selectedCities.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-black dark:text-white">
                            Selected Cities ({selectedCities.length}{tierLimits.maxCities ? `/${tierLimits.maxCities}` : ''})
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedCities.map((city) => (
                              <Badge
                                key={`${city.cityName}-${city.stateCode}`}
                                variant="secondary"
                                className={cn(
                                  "pl-3 pr-2 py-2 text-sm flex items-center gap-2",
                                  city.isPrimary && "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                )}
                              >
                                <MapPin className="w-3 h-3" />
                                {city.cityName}, {city.stateName}
                                {city.isPrimary && <span className="text-xs">(Primary)</span>}
                                <button
                                  onClick={() => handleRemoveCity(city.cityName, city.stateCode)}
                                  className="ml-1 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          {/* Same-province constraint reminder for tiers with requireSameProvince */}
                          {tierLimits.requireSameProvince && selectedCities.length > 0 && 
                           (!tierLimits.maxCities || selectedCities.length < tierLimits.maxCities) && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              Additional cities must be in {selectedCities[0].stateName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Services selection */}
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <Label className="text-sm font-semibold text-black dark:text-white">Services You Offer *</Label>
                        <p className="text-sm text-gray-500 mt-1">Select the services you'll provide in your area</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(() => {
                          const tierServices = getServicesForTier(selectedTier);
                          return tierServices.map((service) => (
                            <div
                              key={service.id}
                              onClick={() => handleServiceToggle(service.name)}
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                formData.services.includes(service.name)
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                              )}
                              data-testid={`service-${service.id}`}
                            >
                              <Checkbox
                                variant="circular"
                                checked={formData.services.includes(service.name)}
                                className="pointer-events-none"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-black dark:text-white">{service.name}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{service.description}</p>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>

                      {formData.services.length > 0 && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          {formData.services.length} service(s) selected
                        </p>
                      )}
                    </div>

                    {/* Emergency toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-semibold text-black dark:text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-500" />
                          Emergency Availability
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">Accept urgent 24/7 requests in your area</p>
                      </div>
                      <Switch
                        checked={formData.emergencyAvailable}
                        onCheckedChange={(checked) => handleInputChange("emergencyAvailable", checked)}
                        data-testid="switch-emergency"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Vehicle Details (Pro/Equipped) or Equipment (Manual) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {(selectedTier === "professional" || selectedTier === "equipped") ? (
                  // Vehicle Details
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-500" />
                        Vehicle Type *
                      </Label>
                      <Select
                        value={formData.vehicleType}
                        onValueChange={(value) => handleInputChange("vehicleType", value)}
                      >
                        <SelectTrigger className="h-12 rounded-xl" data-testid="select-vehicle-type">
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleMake" className="text-sm font-semibold text-black dark:text-white">Make *</Label>
                        <Input
                          id="vehicleMake"
                          value={formData.vehicleMake}
                          onChange={(e) => handleInputChange("vehicleMake", e.target.value)}
                          placeholder="Ford"
                          className="h-12 rounded-xl"
                          data-testid="input-vehicle-make"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleModel" className="text-sm font-semibold text-black dark:text-white">Model *</Label>
                        <Input
                          id="vehicleModel"
                          value={formData.vehicleModel}
                          onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                          placeholder="F-350"
                          className="h-12 rounded-xl"
                          data-testid="input-vehicle-model"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleYear" className="text-sm font-semibold text-black dark:text-white">Year *</Label>
                        <Input
                          id="vehicleYear"
                          value={formData.vehicleYear}
                          onChange={(e) => handleInputChange("vehicleYear", e.target.value)}
                          placeholder="2023"
                          className="h-12 rounded-xl"
                          data-testid="input-vehicle-year"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licensePlate" className="text-sm font-semibold text-black dark:text-white">License Plate *</Label>
                        <Input
                          id="licensePlate"
                          value={formData.licensePlate}
                          onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                          placeholder="ABC-1234"
                          className="h-12 rounded-xl"
                          data-testid="input-license-plate"
                        />
                      </div>
                    </div>

                    {/* Vehicle photo upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-gray-500" />
                        Vehicle Photo (Optional)
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Click to upload vehicle photo
                        </p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                      </div>
                    </div>
                  </>
                ) : (
                  // Manual tier - Equipment selection
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-black dark:text-white">Your Equipment *</Label>
                        <p className="text-sm text-gray-500 mt-1">Select all equipment you have available</p>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {manualEquipment.map((equipment) => (
                          <div
                            key={equipment}
                            onClick={() => handleEquipmentToggle(equipment)}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                              formData.equipment.includes(equipment)
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                            )}
                            data-testid={`equipment-${equipment.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Checkbox
                              variant="circular"
                              checked={formData.equipment.includes(equipment)}
                              className="pointer-events-none"
                            />
                            <span className="text-sm font-medium text-black dark:text-white">{equipment}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availableHours" className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        Available Hours
                      </Label>
                      <Input
                        id="availableHours"
                        value={formData.availableHours}
                        onChange={(e) => handleInputChange("availableHours", e.target.value)}
                        placeholder="e.g., Mornings, Evenings, Weekends"
                        className="h-12 rounded-xl"
                        data-testid="input-available-hours"
                      />
                    </div>

                    {/* Equipment photos */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-gray-500" />
                        Equipment Photos (Optional)
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-xs text-gray-500">Photo 1</p>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-xs text-gray-500">Photo 2</p>
                        </div>
                      </div>
                    </div>

                    {/* Operating radius info */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100">
                            Operating Radius
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            As a manual operator, you can accept jobs within <strong>{OPERATOR_TIER_INFO.manual.radiusKm}km</strong> from your home address.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Documents (Pro) or Complete (Equipped/Manual) */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {selectedTier === "professional" ? (
                  // Document uploads for professional
                  <>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-900 dark:text-amber-100">
                            Optional Documents
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Upload these documents later to speed up your verification process.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { title: "Business License", icon: FileText },
                        { title: "Insurance Certificate", icon: Shield },
                        { title: "Vehicle Registration", icon: Truck },
                        { title: "Driver's License", icon: User },
                      ].map((doc) => (
                        <div
                          key={doc.title}
                          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
                        >
                          <doc.icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm font-medium text-black dark:text-white">{doc.title}</p>
                          <p className="text-xs text-gray-500 mt-1">PDF or Image</p>
                          <Button variant="outline" size="sm" className="mt-3">
                            Upload
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  // Completion screen for Equipped/Manual
                  <div className="text-center py-8 space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-black dark:text-white">
                        You're Almost Ready!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Complete your registration to access your operator dashboard.
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 max-w-sm mx-auto text-left">
                      <h4 className="font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-orange-500" />
                        What's Next?
                      </h4>
                      <ul className="space-y-3">
                        {[
                          "Access your operator dashboard",
                          "Upload verification documents",
                          "Go online and start earning!",
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          {/* Action Buttons */}
          <div className="px-6 sm:px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="h-12 px-6 rounded-xl"
                  data-testid="button-previous"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (user?.operatorId && isLoadingOperator)}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30"
                  data-testid="button-complete"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30"
                  data-testid="button-next"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Trust indicators */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Secure & Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
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
