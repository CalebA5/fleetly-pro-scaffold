import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Upload, 
  X, 
  Loader2, 
  TrendingUp, 
  MapPin, 
  DollarSign,
  Truck,
  Star,
  ArrowRight
} from "lucide-react";

interface ServiceRecommendation {
  serviceType: string;
  confidence: number;
  estimatedCost: string;
  reasoning: string;
  urgency: "low" | "medium" | "high";
  nearbyOperators: {
    name: string;
    distance: string;
    rating: number;
    price: string;
  }[];
}

export const AIAssist = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);

  const analyzeJobMutation = useMutation({
    mutationFn: async ({ description, images }: { description: string; images: File[] }) => {
      // For now, send JSON with image count (mock endpoint doesn't process actual images yet)
      const response = await fetch("/api/ai-assist/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          imageCount: images.length,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze job");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setRecommendations(data.recommendations);
      toast({
        title: "Analysis Complete!",
        description: `Found ${data.recommendations.length} service recommendations for you.`,
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze your job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload up to 5 images.",
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

  const handleAnalyze = () => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe your job to get AI recommendations.",
        variant: "destructive",
      });
      return;
    }

    analyzeJobMutation.mutate({ description, images });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "text-red-600 bg-red-100 dark:bg-red-900/20";
      case "medium": return "text-orange-600 bg-orange-100 dark:bg-orange-900/20";
      default: return "text-green-600 bg-green-100 dark:bg-green-900/20";
    }
  };

  const handleSelectService = (recommendation: ServiceRecommendation) => {
    setLocation(`/customer/create-request?service=${encodeURIComponent(recommendation.serviceType)}&description=${encodeURIComponent(description)}`);
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">AI-Powered Service Assistant</span>
          </div>
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Describe Your Job, Get Smart Recommendations
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload photos and describe what you need. Our AI will analyze your situation and recommend the best services with pricing and nearby operators.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-black dark:text-white">Job Description</CardTitle>
                <CardDescription>Tell us what you need help with</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description" className="text-black dark:text-white">
                    Describe your situation *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Example: I have a large snowdrift blocking my driveway, about 3 feet high and 15 feet wide. Need it cleared ASAP."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="mt-2"
                    data-testid="input-job-description"
                  />
                </div>

                <div>
                  <Label className="text-black dark:text-white">Photos (Optional, up to 5)</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("image-upload")?.click()}
                        disabled={images.length >= 5}
                        data-testid="button-upload-images"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photos
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {images.length}/5 uploaded
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
                      <div className="grid grid-cols-3 gap-2">
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

                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeJobMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  data-testid="button-analyze"
                >
                  {analyzeJobMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get AI Recommendations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Section */}
          <div className="space-y-6">
            {recommendations.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Your AI recommendations will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Recommended Services
                </h2>
                {recommendations.map((rec, index) => (
                  <Card key={index} className="border-2 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-black dark:text-white flex items-center gap-2">
                            <Truck className="w-5 h-5" />
                            {rec.serviceType}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getUrgencyColor(rec.urgency)}>
                              {rec.urgency.toUpperCase()} Priority
                            </Badge>
                            <Badge variant="outline">
                              {rec.confidence}% Match
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-black dark:text-white">
                            {rec.estimatedCost}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Estimated
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {rec.reasoning}
                      </p>

                      {rec.nearbyOperators.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-black dark:text-white">
                            Nearby Operators
                          </h4>
                          {rec.nearbyOperators.slice(0, 2).map((operator, opIndex) => (
                            <div
                              key={opIndex}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-black dark:text-white">
                                    {operator.name}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <MapPin className="w-3 h-3" />
                                    {operator.distance}
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {operator.rating}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-black dark:text-white">
                                {operator.price}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={() => handleSelectService(rec)}
                        className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        data-testid={`button-select-service-${index}`}
                      >
                        Select This Service
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        defaultTab={authTab}
      />
    </div>
  );
};
