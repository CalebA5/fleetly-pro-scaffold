import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Car, Wrench, Trash2, MapPin, Phone, User, ArrowLeft, Loader2, Snowflake, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ServiceType = "towing" | "roadside" | "debris" | "snow_plowing" | "hauling" | "equipment_transport";

interface ServiceOption {
  type: ServiceType;
  title: string;
  description: string;
  icon: typeof Car;
  bgColor: string;
  iconColor: string;
}

const EMERGENCY_SERVICES: ServiceOption[] = [
  {
    type: "towing",
    title: "Tow My Car",
    description: "Vehicle broke down or in accident",
    icon: Car,
    bgColor: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    type: "roadside",
    title: "Roadside Assistance",
    description: "Flat tire, dead battery, locked out",
    icon: Wrench,
    bgColor: "bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    type: "snow_plowing",
    title: "Snow Plowing",
    description: "Snow blocking driveway or road",
    icon: Snowflake,
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 border-cyan-200 dark:border-cyan-800",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    type: "debris",
    title: "Debris Removal",
    description: "Urgent debris blocking access",
    icon: Trash2,
    bgColor: "bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    type: "hauling",
    title: "Hauling Service",
    description: "Urgent waste or material removal",
    icon: Package,
    bgColor: "bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    type: "equipment_transport",
    title: "Equipment Transport",
    description: "Urgent equipment delivery needed",
    icon: Truck,
    bgColor: "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

export default function EmergencySOS() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"select" | "details">("select");
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Form state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Auto-detect location on mount
  useEffect(() => {
    if (step === "details" && !latitude) {
      getLocation();
    }
  }, [step]);

  const getLocation = () => {
    setIsGettingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLatitude(lat);
          setLongitude(lng);
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await response.json();
            setLocation(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          } catch (error) {
            setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
          
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Location error:", error);
          toast({
            title: "Location Access Denied",
            description: "Please allow location access for emergency services or enter your location manually.",
            variant: "destructive",
          });
          setIsGettingLocation(false);
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation. Please enter your location manually.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
    }
  };

  const handleServiceSelect = (type: ServiceType) => {
    setSelectedService(type);
    setStep("details");
    
    // Set default description based on service type
    const service = EMERGENCY_SERVICES.find(s => s.type === type);
    if (service) {
      setDescription(`Emergency: ${service.title} - `);
    }
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService) {
      toast({
        title: "Service Type Required",
        description: "Please select an emergency service type.",
        variant: "destructive",
      });
      return;
    }
    
    if (!contactPhone || contactPhone.length < 10) {
      toast({
        title: "Phone Number Required",
        description: "We need your phone number to coordinate emergency response.",
        variant: "destructive",
      });
      return;
    }
    
    // If no coordinates but we have a location text, try to geocode it
    let finalLat = latitude;
    let finalLng = longitude;
    
    if (!finalLat || !finalLng) {
      if (!location || location.trim().length < 5) {
        toast({
          title: "Location Required",
          description: "Please enable location access or enter your full address.",
          variant: "destructive",
        });
        return;
      }
      
      // Try to geocode the manual address
      setIsSubmitting(true);
      toast({
        title: "Finding Your Location",
        description: "Geocoding your address...",
      });
      
      const coords = await geocodeAddress(location);
      if (!coords) {
        toast({
          title: "Address Not Found",
          description: "Unable to find your address. Please try enabling location access or enter a more specific address.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      finalLat = coords.lat;
      finalLng = coords.lng;
      setLatitude(finalLat);
      setLongitude(finalLng);
    }
    
    setIsSubmitting(true);
    
    try {
      const emergencyId = `EMRG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const response = await apiRequest("/api/emergency-requests", {
        method: "POST",
        body: JSON.stringify({
          emergencyId,
          contactName: contactName || "Emergency Caller",
          contactPhone,
          contactEmail: contactEmail || "",
          serviceType: selectedService,
          description,
          location,
          latitude: finalLat,
          longitude: finalLng,
        }),
      });
      
      toast({
        title: "✅ Emergency Request Sent!",
        description: "Notifying nearby operators now. You'll receive a call shortly.",
      });
      
      // Navigate to tracking page
      navigate(`/emergency-tracking/${emergencyId}`);
      
    } catch (error: any) {
      console.error("Emergency request error:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Unable to submit emergency request. Please call 911 if this is life-threatening.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 dark:from-red-700 dark:to-orange-600 text-white py-6 px-4 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {step === "details" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("select")}
                className="text-white hover:bg-white/20"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 md:w-10 md:h-10 animate-pulse" />
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  EMERGENCY HELP
                </h1>
                <p className="text-white/90 text-sm md:text-base">
                  {step === "select" ? "Select your emergency type" : "Provide contact details"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {step === "select" ? (
          /* Service Selection Step */
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm md:text-base font-medium text-center">
                ⚠️ For life-threatening emergencies, call 911 immediately
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EMERGENCY_SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.type}
                    onClick={() => handleServiceSelect(service.type)}
                    className={`group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-2 ${service.bgColor}`}
                    data-testid={`button-service-${service.type}`}
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* Squared modern icon container */}
                      <div className={`w-16 h-16 rounded-lg ${service.iconColor} bg-white dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {service.title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Details Form Step */
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
            <div className="space-y-4">
              {/* Contact Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Your Name (Optional)
                </label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe"
                  className="text-base"
                  data-testid="input-contact-name"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                  className="text-base"
                  data-testid="input-contact-phone"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Required so operators can contact you
                </p>
              </div>

              {/* Contact Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="text-base"
                  data-testid="input-contact-email"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Your Location <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="123 Main St, City, State"
                    required
                    className="text-base flex-1"
                    data-testid="input-location"
                  />
                  <Button
                    type="button"
                    onClick={getLocation}
                    disabled={isGettingLocation}
                    variant="outline"
                    data-testid="button-get-location"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {latitude && longitude && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Location detected: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Describe the Emergency <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about your emergency situation..."
                  required
                  rows={4}
                  className="text-base"
                  data-testid="input-description"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !latitude || !longitude}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-xl"
              data-testid="button-submit-emergency"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Notifying Operators...
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Send Emergency Request
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              By submitting, nearby operators will be notified immediately. You'll receive a call within minutes.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
