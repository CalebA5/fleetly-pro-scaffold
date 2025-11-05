import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  X, 
  Loader2, 
  MapPin, 
  Calendar,
  DollarSign,
  Sparkles,
  Send
} from "lucide-react";

export const CreateServiceRequest = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  
  // Get service type from URL params if coming from AI Assist
  const params = new URLSearchParams(window.location.search);
  const prefilledService = params.get("service") || "";
  const prefilledDescription = params.get("description") || "";

  const [serviceType, setServiceType] = useState(prefilledService);
  const [jobDescription, setJobDescription] = useState(prefilledDescription);
  const [locationAddress, setLocationAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      // This would send to backend in production
      return apiRequest("/api/service-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Request Submitted!",
        description: "Your service request has been sent to nearby operators.",
      });
      setLocation(`/customer/service-request?requestId=${data.id}`);
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
    // Validate form
    if (!serviceType) {
      toast({
        title: "Service Type Required",
        description: "Please select the type of service you need.",
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

    // Check authentication ONLY when user tries to submit
    if (!isAuthenticated) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to send your service request to operators.",
      });
      setShowAuthDialog(true);
      return;
    }

    // All validations passed and user is authenticated, submit the request
    createRequestMutation.mutate({
      serviceType,
      description: jobDescription,
      location: locationAddress,
      preferredDate,
      budgetRange,
      urgency,
      imageCount: images.length,
    });
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
            Request a Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Provide details about your job and we'll connect you with qualified operators
          </p>
        </div>

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
            <CardTitle className="text-black dark:text-white">Service Details</CardTitle>
            <CardDescription>Fill out the information below to request a service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Type */}
            <div>
              <Label htmlFor="service-type" className="text-black dark:text-white">
                Service Type *
              </Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="mt-2" data-testid="select-service-type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Snow Plowing">Snow Plowing</SelectItem>
                  <SelectItem value="Towing">Towing</SelectItem>
                  <SelectItem value="Hauling">Hauling</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                  <SelectItem value="Ice Removal">Ice Removal</SelectItem>
                  <SelectItem value="Roadside Assistance">Roadside Assistance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Job Description */}
            <div>
              <Label htmlFor="description" className="text-black dark:text-white">
                Job Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what you need in detail. Include size, location specifics, any special requirements..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={5}
                className="mt-2"
                data-testid="input-job-description"
              />
            </div>

            {/* Location */}
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

            {/* Date and Budget Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred-date" className="text-black dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Preferred Date
                </Label>
                <Input
                  id="preferred-date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="mt-2"
                  data-testid="input-preferred-date"
                />
              </div>
              <div>
                <Label htmlFor="budget" className="text-black dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Budget Range
                </Label>
                <Select value={budgetRange} onValueChange={setBudgetRange}>
                  <SelectTrigger className="mt-2" data-testid="select-budget">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$0-$50">$0 - $50</SelectItem>
                    <SelectItem value="$50-$100">$50 - $100</SelectItem>
                    <SelectItem value="$100-$200">$100 - $200</SelectItem>
                    <SelectItem value="$200-$500">$200 - $500</SelectItem>
                    <SelectItem value="$500+">$500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Urgency */}
            <div>
              <Label className="text-black dark:text-white">Urgency Level</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger className="mt-2" data-testid="select-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Within a week</SelectItem>
                  <SelectItem value="normal">Normal - Within 2-3 days</SelectItem>
                  <SelectItem value="high">High - Within 24 hours</SelectItem>
                  <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Photo Upload */}
            <div>
              <Label className="text-black dark:text-white">Photos (Optional, up to 10)</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Upload photos to help operators understand your job better
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={images.length >= 10}
                    data-testid="button-upload-images"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {images.length}/10 uploaded
                  </span>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={createRequestMutation.isPending}
                className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 h-12 text-lg"
                data-testid="button-submit-request"
              >
                {createRequestMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Request to Operators
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                {!isAuthenticated && "You'll be asked to sign in before sending"}
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
