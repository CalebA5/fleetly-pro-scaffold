import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Upload, 
  X, 
  Loader2, 
  MapPin, 
  Calendar,
  Clock,
  DollarSign,
  Sparkles,
  Send,
  AlertCircle,
  Snowflake,
  Car,
  Truck,
  Package,
  Layers,
  Plus
} from "lucide-react";
import { ServiceSelector } from "@/components/ServiceSelector";
import { TIER_SERVICES } from "@shared/tierCapabilities";

export const CreateServiceRequest = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  
  const params = new URLSearchParams(window.location.search);
  const prefilledService = params.get("service") || "";
  const prefilledDescription = params.get("description") || "";
  const prefilledOperatorId = params.get("operatorId") || "";
  const prefilledOperatorName = params.get("operatorName") || "";

  // Basic Fields
  const [serviceType, setServiceType] = useState(prefilledService);
  const [selectedServices, setSelectedServices] = useState<string[]>(prefilledService ? [prefilledService] : []);
  const [isProjectMode, setIsProjectMode] = useState(false);
  const [pricingPreference, setPricingPreference] = useState<"fixed" | "hourly" | "custom_quote">("custom_quote");
  const [isEmergency, setIsEmergency] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<"low" | "medium" | "high" | "emergency">("medium");
  const [showScheduleFields, setShowScheduleFields] = useState(false);
  const [jobDescription, setJobDescription] = useState(prefilledDescription);
  const [locationAddress, setLocationAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [timeFlexibility, setTimeFlexibility] = useState("flexible");
  const [budgetRange, setBudgetRange] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedOperatorId] = useState(prefilledOperatorId);
  const [selectedOperatorName] = useState(prefilledOperatorName);

  // Snow Plowing Specific
  const [snowAreaSize, setSnowAreaSize] = useState("");
  const [snowSurfaceType, setSnowSurfaceType] = useState("");
  const [snowDepth, setSnowDepth] = useState("");
  const [hasObstacles, setHasObstacles] = useState(false);
  const [needsSalting, setNeedsSalting] = useState(false);

  // Towing Specific
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleCondition, setVehicleCondition] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [towingReason, setTowingReason] = useState("");

  // Hauling Specific
  const [itemType, setItemType] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [itemDimensions, setItemDimensions] = useState("");
  const [needsLoadingHelp, setNeedsLoadingHelp] = useState(false);
  const [disposalLocation, setDisposalLocation] = useState("");
  const [numberOfItems, setNumberOfItems] = useState("");

  // Courier Specific
  const [packageSize, setPackageSize] = useState("");
  const [packageWeight, setPackageWeight] = useState("");
  const [isFragile, setIsFragile] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [requiresSignature, setRequiresSignature] = useState(false);

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/service-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Invalidate ALL service request queries so operators see new requests in real-time
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      // This catches all operator-specific queries like /api/service-requests/for-operator/:operatorId
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0]?.toString().startsWith('/api/service-requests/for-operator') || false
      });
      
      toast({
        title: "Request Submitted!",
        description: "Your service request has been sent to nearby operators.",
      });
      setLocation(`/customer/request-status`);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload up to 10 images.",
        variant: "destructive",
      });
      return;
    }

    setImages([...images, ...files]);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // For multi-service mode, check selectedServices; for single service mode, check serviceType
    const hasService = isProjectMode ? selectedServices.length > 0 : !!serviceType;
    
    if (!hasService) {
      toast({
        title: "Service Type Required",
        description: isProjectMode ? "Please select at least one service for your project." : "Please select the type of service you need.",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe what you need help with.",
        variant: "destructive",
      });
      return;
    }

    if (!locationAddress.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter your service location.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to send your service request to operators.",
      });
      setShowAuthDialog(true);
      return;
    }

    // Determine the primary service type
    const primaryServiceType = isProjectMode 
      ? (TIER_SERVICES.find(s => s.id === selectedServices[0])?.name || selectedServices[0])
      : serviceType;
    
    // Get service names for the serviceTypes array
    const serviceTypeNames = selectedServices.map(id => 
      TIER_SERVICES.find(s => s.id === id)?.name || id
    );

    // Build request data - only include fields that have values
    const requestData: any = {
      customerId: user?.id || "",
      customerName: user?.name || "",
      serviceType: primaryServiceType,
      description: jobDescription,
      location: locationAddress,
      imageCount: images.length,
    };
    
    // Add multi-service fields
    if (isProjectMode && selectedServices.length > 0) {
      requestData.serviceTypes = serviceTypeNames;
      requestData.isProjectMode = true;
    }
    if (pricingPreference) {
      requestData.pricingPreference = pricingPreference;
    }
    
    // Add optional fields only if they have values
    if (isEmergency) requestData.isEmergency = true;
    if (urgencyLevel) requestData.urgencyLevel = urgencyLevel;
    if (selectedOperatorId) requestData.operatorId = selectedOperatorId;
    if (selectedOperatorName) requestData.operatorName = selectedOperatorName;
    if (showScheduleFields && preferredDate) requestData.preferredDate = preferredDate;
    if (showScheduleFields && preferredTime) requestData.preferredTime = preferredTime;
    if (timeFlexibility && timeFlexibility !== 'flexible') requestData.timeFlexibility = timeFlexibility;
    if (budgetRange) requestData.budgetRange = budgetRange;

    // Add service-specific data
    if (serviceType === "Snow Plowing") {
      requestData.snowDetails = {
        areaSize: snowAreaSize,
        surfaceType: snowSurfaceType,
        snowDepth,
        hasObstacles,
        needsSalting,
      };
    } else if (serviceType === "Towing") {
      requestData.towingDetails = {
        vehicleType,
        vehicleCondition,
        vehicleMake,
        vehicleModel,
        destination: destinationAddress,
        reason: towingReason,
      };
    } else if (serviceType === "Hauling") {
      requestData.haulingDetails = {
        itemType,
        weight: itemWeight,
        dimensions: itemDimensions,
        needsLoadingHelp,
        disposalLocation,
        numberOfItems,
      };
    } else if (serviceType === "Courier") {
      requestData.courierDetails = {
        packageSize,
        packageWeight,
        isFragile,
        deliveryInstructions,
        requiresSignature,
        destination: destinationAddress,
      };
    }

    createRequestMutation.mutate(requestData);
  };

  const getServiceIcon = () => {
    switch (serviceType) {
      case "Snow Plowing":
      case "Ice Removal":
        return <Snowflake className="w-6 h-6" />;
      case "Towing":
      case "Roadside Assistance":
        return <Car className="w-6 h-6" />;
      case "Hauling":
        return <Truck className="w-6 h-6" />;
      case "Courier":
        return <Package className="w-6 h-6" />;
      default:
        return <Truck className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header 
        onSignIn={() => {
          setAuthTab("signin");
          setShowAuthDialog(true);
        }}
        onSignUp={() => {
          setAuthTab("signup");
          setShowAuthDialog(true);
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
            Request a Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Provide detailed information so operators can give you accurate quotes and service
          </p>
        </div>

        {/* Prefilled Operator Info Banner */}
        {selectedOperatorName && (
          <Card className="mb-6 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedOperatorName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-black dark:text-white">Requesting service from {selectedOperatorName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This request will be sent directly to this operator
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Clear all URL params and navigate to operators page
                    window.history.replaceState({}, '', '/customer/create-request');
                    setLocation("/customer/operators");
                  }}
                  className="whitespace-nowrap"
                  data-testid="button-change-operator"
                >
                  Change Operator
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Assist Prompt */}
        <Card className="mb-6 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <div>
                  <h3 className="font-semibold text-black dark:text-white">Not sure which service you need?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Try our AI Assist to get personalized recommendations
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setLocation("/customer/ai-assist")}
                className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400"
                data-testid="button-try-ai-assist"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try AI Assist
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black dark:text-white flex items-center gap-2">
              {getServiceIcon()}
              Service Details
            </CardTitle>
            <CardDescription>Complete all relevant fields to help operators prepare the best service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Basic Service Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-black dark:text-white border-b pb-2">
                Basic Information
              </h3>

              {/* Project Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <Label htmlFor="project-mode" className="text-base font-semibold text-black dark:text-white cursor-pointer">
                      Project Mode
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Request multiple services at once for bundled pricing
                    </p>
                  </div>
                </div>
                <Switch 
                  id="project-mode"
                  checked={isProjectMode}
                  onCheckedChange={(checked) => {
                    setIsProjectMode(checked);
                    if (!checked) {
                      setSelectedServices([]);
                    }
                  }}
                  data-testid="switch-project-mode"
                />
              </div>

              {/* Service Type Selection */}
              <div>
                <Label className="text-black dark:text-white mb-3 block">
                  {isProjectMode ? "Select Services for Your Project *" : "Select Service Type *"}
                </Label>
                
                {isProjectMode ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <ServiceSelector
                        selectedServices={selectedServices}
                        onServicesChange={setSelectedServices}
                        placeholder="Select multiple services..."
                        className="w-full"
                      />
                    </div>
                    {selectedServices.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-black dark:text-white">{selectedServices.length}</span> service(s) selected
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: "Snow Plowing", icon: Snowflake, label: "Snow Plowing", color: "blue" },
                      { value: "Towing", icon: Truck, label: "Towing", color: "orange" },
                      { value: "Hauling", icon: Package, label: "Hauling", color: "green" },
                      { value: "Courier", icon: Send, label: "Courier", color: "purple" },
                      { value: "Ice Removal", icon: Snowflake, label: "Ice Removal", color: "cyan" },
                      { value: "Roadside Assistance", icon: Car, label: "Roadside", color: "red" }
                    ].map((service) => {
                      const Icon = service.icon;
                      const isSelected = serviceType === service.value;
                      return (
                        <button
                          key={service.value}
                          type="button"
                          onClick={() => setServiceType(service.value)}
                          className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                            isSelected
                              ? `border-${service.color}-500 bg-${service.color}-50 dark:bg-${service.color}-900/20 shadow-lg`
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          data-testid={`button-service-${service.value.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Icon className={`w-8 h-8 mx-auto mb-2 ${
                            isSelected ? `text-${service.color}-600 dark:text-${service.color}-400` : 'text-gray-600 dark:text-gray-400'
                          }`} />
                          <p className={`text-sm font-medium ${
                            isSelected ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>{service.label}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pricing Preference - Only show in project mode */}
              {isProjectMode && selectedServices.length > 0 && (
                <div>
                  <Label className="text-black dark:text-white mb-3 block">
                    <DollarSign className="w-4 h-4 inline-block mr-1" />
                    Pricing Preference
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "fixed" as const, label: "Fixed Price", desc: "Total cost upfront" },
                      { value: "hourly" as const, label: "Hourly Rate", desc: "Pay by the hour" },
                      { value: "custom_quote" as const, label: "Custom Quote", desc: "Get operator quotes" }
                    ].map((option) => {
                      const isSelected = pricingPreference === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPricingPreference(option.value)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          data-testid={`button-pricing-${option.value}`}
                        >
                          <p className={`text-sm font-medium ${
                            isSelected ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>{option.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Urgency Level Selector */}
              <div>
                <Label className="text-black dark:text-white mb-3 block">
                  Urgency Level *
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: "low" as const, label: "Low", icon: "🟢", desc: "Flexible timing" },
                    { value: "medium" as const, label: "Medium", icon: "🟡", desc: "Within days" },
                    { value: "high" as const, label: "High", icon: "🟠", desc: "Within hours" },
                    { value: "emergency" as const, label: "Emergency", icon: "🔴", desc: "Immediate" }
                  ].map((level) => {
                    const isSelected = urgencyLevel === level.value;
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setUrgencyLevel(level.value)}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                        data-testid={`button-urgency-${level.value}`}
                      >
                        <div className="text-2xl mb-1">{level.icon}</div>
                        <p className={`text-sm font-semibold ${
                          isSelected ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>{level.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{level.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Job Description */}
              <div>
                <Label htmlFor="description" className="text-black dark:text-white">
                  Detailed Job Description *
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Describe what you need in detail. Include size, location specifics, any special requirements...
                </p>
                <Textarea
                  id="description"
                  placeholder="Example: I have a large snowdrift blocking my driveway, about 3 feet high and 15 feet wide. Need it cleared ASAP."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={5}
                  className="mt-2"
                  data-testid="input-job-description"
                />
              </div>
            </div>

            {/* Location & Timing */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-black dark:text-white border-b pb-2">
                Location & Timing
              </h3>

              {/* Service Location */}
              <div>
                <Label htmlFor="location" className="text-black dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Service Location *
                </Label>
                <Input
                  id="location"
                  placeholder="123 Main St, City, State ZIP"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="mt-2"
                  data-testid="input-location"
                />
              </div>

              {/* Schedule Service Toggle */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <Label htmlFor="schedule-service" className="text-base font-semibold text-black dark:text-white cursor-pointer">
                        Schedule for Later
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Choose a specific date and time for the service
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="schedule-service"
                    checked={showScheduleFields}
                    onCheckedChange={setShowScheduleFields}
                    data-testid="switch-schedule-service"
                  />
                </div>
              </div>

              {/* Date/Time Fields - Revealed when toggle is ON */}
              {showScheduleFields && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top duration-300">
                  {/* Preferred Date */}
                  <div>
                    <Label htmlFor="date" className="text-black dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Preferred Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="mt-2"
                      data-testid="input-date"
                    />
                  </div>

                  {/* Preferred Time */}
                  <div>
                    <Label htmlFor="time" className="text-black dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Preferred Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="mt-2"
                      data-testid="input-time"
                    />
                  </div>

                  {/* Time Flexibility */}
                  <div className="md:col-span-2">
                    <Label className="text-black dark:text-white">Time Flexibility</Label>
                    <RadioGroup value={timeFlexibility} onValueChange={setTimeFlexibility} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="exact" id="exact" data-testid="radio-exact" />
                        <Label htmlFor="exact" className="font-normal">Must be at exact time specified</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="flexible" id="flexible" data-testid="radio-flexible" />
                        <Label htmlFor="flexible" className="font-normal">Flexible - Within a few hours is fine</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="very-flexible" id="very-flexible" data-testid="radio-very-flexible" />
                        <Label htmlFor="very-flexible" className="font-normal">Very Flexible - Anytime that day works</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}
            </div>

            {/* Service-Specific Fields */}
            {serviceType === "Snow Plowing" && (
              <div className="space-y-6 bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-black dark:text-white border-b border-blue-300 dark:border-blue-700 pb-2 flex items-center gap-2">
                  <Snowflake className="w-5 h-5" />
                  Snow Plowing Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="area-size" className="text-black dark:text-white">Area Size</Label>
                    <Select value={snowAreaSize} onValueChange={setSnowAreaSize}>
                      <SelectTrigger className="mt-2" data-testid="select-area-size">
                        <SelectValue placeholder="Select area size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (Single car driveway)</SelectItem>
                        <SelectItem value="medium">Medium (2-3 car driveway)</SelectItem>
                        <SelectItem value="large">Large (4+ car driveway or small lot)</SelectItem>
                        <SelectItem value="xlarge">Extra Large (Parking lot)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="surface-type" className="text-black dark:text-white">Surface Type</Label>
                    <Select value={snowSurfaceType} onValueChange={setSnowSurfaceType}>
                      <SelectTrigger className="mt-2" data-testid="select-surface-type">
                        <SelectValue placeholder="Select surface" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asphalt">Asphalt Driveway</SelectItem>
                        <SelectItem value="concrete">Concrete Driveway</SelectItem>
                        <SelectItem value="gravel">Gravel Driveway</SelectItem>
                        <SelectItem value="parking-lot">Parking Lot</SelectItem>
                        <SelectItem value="walkway">Walkway/Sidewalk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="snow-depth" className="text-black dark:text-white">Estimated Snow Depth</Label>
                    <Select value={snowDepth} onValueChange={setSnowDepth}>
                      <SelectTrigger className="mt-2" data-testid="select-snow-depth">
                        <SelectValue placeholder="Select depth" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light (1-3 inches)</SelectItem>
                        <SelectItem value="medium">Medium (4-8 inches)</SelectItem>
                        <SelectItem value="heavy">Heavy (9-15 inches)</SelectItem>
                        <SelectItem value="severe">Severe (15+ inches)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="obstacles" className="text-black dark:text-white">Obstacles Present?</Label>
                      <Switch
                        id="obstacles"
                        checked={hasObstacles}
                        onCheckedChange={setHasObstacles}
                        data-testid="switch-obstacles"
                      />
                    </div>
                    {hasObstacles && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Operators will work carefully around cars, decorations, or other obstacles
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="salting" className="text-black dark:text-white">Include Salting/De-icing?</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Additional service for ice prevention</p>
                      </div>
                      <Switch
                        id="salting"
                        checked={needsSalting}
                        onCheckedChange={setNeedsSalting}
                        data-testid="switch-salting"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {serviceType === "Towing" && (
              <div className="space-y-6 bg-red-50 dark:bg-red-900/10 p-6 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="text-lg font-semibold text-black dark:text-white border-b border-red-300 dark:border-red-700 pb-2 flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Towing Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="vehicle-type" className="text-black dark:text-white">Vehicle Type *</Label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger className="mt-2" data-testid="select-vehicle-type">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan/Coupe</SelectItem>
                        <SelectItem value="suv">SUV/Crossover</SelectItem>
                        <SelectItem value="truck">Pickup Truck</SelectItem>
                        <SelectItem value="van">Van/Minivan</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="heavy">Heavy Vehicle/RV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vehicle-condition" className="text-black dark:text-white">Vehicle Condition *</Label>
                    <Select value={vehicleCondition} onValueChange={setVehicleCondition}>
                      <SelectTrigger className="mt-2" data-testid="select-vehicle-condition">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="runs">Runs and drives</SelectItem>
                        <SelectItem value="starts-no-drive">Starts but won't drive</SelectItem>
                        <SelectItem value="no-start">Won't start</SelectItem>
                        <SelectItem value="accident">Accident damage</SelectItem>
                        <SelectItem value="stuck">Stuck/Off-road</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vehicle-make" className="text-black dark:text-white">Vehicle Make</Label>
                    <Input
                      id="vehicle-make"
                      placeholder="e.g., Toyota"
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      className="mt-2"
                      data-testid="input-vehicle-make"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicle-model" className="text-black dark:text-white">Vehicle Model</Label>
                    <Input
                      id="vehicle-model"
                      placeholder="e.g., Camry"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="mt-2"
                      data-testid="input-vehicle-model"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="destination" className="text-black dark:text-white">Destination Address *</Label>
                    <Input
                      id="destination"
                      placeholder="Where should we tow your vehicle?"
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      className="mt-2"
                      data-testid="input-destination"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="towing-reason" className="text-black dark:text-white">Reason for Towing</Label>
                    <Textarea
                      id="towing-reason"
                      placeholder="e.g., Flat tire, engine trouble, accident, repossession, etc."
                      value={towingReason}
                      onChange={(e) => setTowingReason(e.target.value)}
                      rows={3}
                      className="mt-2"
                      data-testid="input-towing-reason"
                    />
                  </div>
                </div>
              </div>
            )}

            {serviceType === "Hauling" && (
              <div className="space-y-6 bg-green-50 dark:bg-green-900/10 p-6 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-black dark:text-white border-b border-green-300 dark:border-green-700 pb-2 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Hauling Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="item-type" className="text-black dark:text-white">Type of Items *</Label>
                    <Select value={itemType} onValueChange={setItemType}>
                      <SelectTrigger className="mt-2" data-testid="select-item-type">
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="appliances">Appliances</SelectItem>
                        <SelectItem value="construction">Construction Debris</SelectItem>
                        <SelectItem value="yard-waste">Yard Waste</SelectItem>
                        <SelectItem value="junk">General Junk/Trash</SelectItem>
                        <SelectItem value="moving">Moving Boxes/Items</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="item-weight" className="text-black dark:text-white">Estimated Weight</Label>
                    <Select value={itemWeight} onValueChange={setItemWeight}>
                      <SelectTrigger className="mt-2" data-testid="select-item-weight">
                        <SelectValue placeholder="Select weight range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light (Under 100 lbs)</SelectItem>
                        <SelectItem value="medium">Medium (100-500 lbs)</SelectItem>
                        <SelectItem value="heavy">Heavy (500-1000 lbs)</SelectItem>
                        <SelectItem value="very-heavy">Very Heavy (1000+ lbs)</SelectItem>
                        <SelectItem value="unknown">Not sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="number-items" className="text-black dark:text-white">Number of Items</Label>
                    <Input
                      id="number-items"
                      type="number"
                      placeholder="e.g., 5"
                      value={numberOfItems}
                      onChange={(e) => setNumberOfItems(e.target.value)}
                      className="mt-2"
                      data-testid="input-number-items"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dimensions" className="text-black dark:text-white">Approximate Dimensions</Label>
                    <Input
                      id="dimensions"
                      placeholder="e.g., 6ft x 4ft x 3ft"
                      value={itemDimensions}
                      onChange={(e) => setItemDimensions(e.target.value)}
                      className="mt-2"
                      data-testid="input-dimensions"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="loading-help" className="text-black dark:text-white">Need Loading Assistance?</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">We'll help load items into the truck</p>
                      </div>
                      <Switch
                        id="loading-help"
                        checked={needsLoadingHelp}
                        onCheckedChange={setNeedsLoadingHelp}
                        data-testid="switch-loading-help"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="disposal" className="text-black dark:text-white">Disposal/Delivery Location</Label>
                    <Input
                      id="disposal"
                      placeholder="Where should we take the items? (dump, donation center, new address)"
                      value={disposalLocation}
                      onChange={(e) => setDisposalLocation(e.target.value)}
                      className="mt-2"
                      data-testid="input-disposal"
                    />
                  </div>
                </div>
              </div>
            )}

            {serviceType === "Courier" && (
              <div className="space-y-6 bg-purple-50 dark:bg-purple-900/10 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-black dark:text-white border-b border-purple-300 dark:border-purple-700 pb-2 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Courier Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="package-size" className="text-black dark:text-white">Package Size *</Label>
                    <Select value={packageSize} onValueChange={setPackageSize}>
                      <SelectTrigger className="mt-2" data-testid="select-package-size">
                        <SelectValue placeholder="Select package size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="envelope">Envelope/Document</SelectItem>
                        <SelectItem value="small-box">Small Box (shoebox size)</SelectItem>
                        <SelectItem value="medium-box">Medium Box</SelectItem>
                        <SelectItem value="large-box">Large Box</SelectItem>
                        <SelectItem value="multiple">Multiple Packages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="package-weight" className="text-black dark:text-white">Package Weight</Label>
                    <Select value={packageWeight} onValueChange={setPackageWeight}>
                      <SelectTrigger className="mt-2" data-testid="select-package-weight">
                        <SelectValue placeholder="Select weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-5">Under 5 lbs</SelectItem>
                        <SelectItem value="5-15">5-15 lbs</SelectItem>
                        <SelectItem value="15-30">15-30 lbs</SelectItem>
                        <SelectItem value="30-50">30-50 lbs</SelectItem>
                        <SelectItem value="over-50">Over 50 lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="courier-destination" className="text-black dark:text-white">Delivery Address *</Label>
                    <Input
                      id="courier-destination"
                      placeholder="Where should we deliver this package?"
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      className="mt-2"
                      data-testid="input-courier-destination"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label htmlFor="fragile" className="text-black dark:text-white">Fragile/Handle with Care</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Special handling required</p>
                      </div>
                      <Switch
                        id="fragile"
                        checked={isFragile}
                        onCheckedChange={setIsFragile}
                        data-testid="switch-fragile"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="signature" className="text-black dark:text-white">Requires Signature?</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Recipient must sign for delivery</p>
                      </div>
                      <Switch
                        id="signature"
                        checked={requiresSignature}
                        onCheckedChange={setRequiresSignature}
                        data-testid="switch-signature"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="delivery-instructions" className="text-black dark:text-white">Delivery Instructions</Label>
                    <Textarea
                      id="delivery-instructions"
                      placeholder="e.g., Leave at front door, call upon arrival, use side entrance..."
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      rows={3}
                      className="mt-2"
                      data-testid="input-delivery-instructions"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black dark:text-white border-b pb-2">
                Photos (Optional, up to 10)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Photos help operators understand your situation better and provide more accurate quotes
              </p>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Click to upload photos
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {images.length}/10 uploaded
                  </span>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="input-photo-upload"
                  />
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Budget */}
            <div>
              <Label htmlFor="budget" className="text-black dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Budget Range (Optional)
              </Label>
              <Select value={budgetRange} onValueChange={setBudgetRange}>
                <SelectTrigger className="mt-2" data-testid="select-budget">
                  <SelectValue placeholder="Select your budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-50">Under $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100-200">$100 - $200</SelectItem>
                  <SelectItem value="200-500">$200 - $500</SelectItem>
                  <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                  <SelectItem value="over-1000">Over $1,000</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <Button
                onClick={handleSubmit}
                disabled={createRequestMutation.isPending}
                className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                size="lg"
                data-testid="button-submit-request"
              >
                {createRequestMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Request to Operators
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-3">
                {isAuthenticated 
                  ? "Your request will be sent to nearby operators who can provide quotes"
                  : "You'll be asked to sign in before sending to protect operators from spam"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        defaultTab={authTab}
      />
    </div>
  );
};
