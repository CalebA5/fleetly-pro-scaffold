import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, ArrowLeft, Truck, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const aiRecommendations = [
  {
    service: "Snow Plowing",
    vehicle: "Pickup Truck with Plow",
    confidence: 92,
    reasoning: "Based on your photo, this appears to be a residential driveway with snow accumulation.",
    estimatedPrice: "$75-$120",
  },
  {
    service: "Hauling", 
    vehicle: "Box Truck",
    confidence: 78,
    reasoning: "Alternative option if you need debris removal after snow clearing.",
    estimatedPrice: "$150-$250",
  },
];

export const ServiceSelection = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedService = null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "Photo uploaded",
        description: "Ready for AI analysis",
      });
    }
  };

  const handleAIRecommendation = async () => {
    if (!selectedFile && !description) {
      toast({
        title: "Missing information",
        description: "Please upload a photo or add a description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setShowRecommendations(true);
      setLoading(false);
      toast({
        title: "Recommendations ready!",
        description: "AI has analyzed your request",
      });
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/customer">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Service Selection</h1>
          {selectedService && (
            <p className="text-muted-foreground">Pre-selected: {selectedService}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Recommender */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-accent" />
              <span>AI Service Recommender</span>
            </CardTitle>
            <CardDescription>
              Upload a photo and describe your needs for personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Upload Photo</label>
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : "Click to upload photo"}
                  </p>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Describe Your Needs</label>
              <Textarea
                placeholder="Tell us about your project, location, urgency, and any specific requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleAIRecommendation}
              disabled={loading}
              className="w-full"
              variant="hero"
            >
              {loading ? "Analyzing..." : "Get AI Recommendations"}
            </Button>
          </CardContent>
        </Card>

        {/* Recommendations or Manual Selection */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>
              {showRecommendations ? "AI Recommendations" : "Manual Service Selection"}
            </CardTitle>
            <CardDescription>
              {showRecommendations 
                ? "Based on your input, here are our recommendations" 
                : "Browse available services and vehicles manually"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showRecommendations ? (
              <div className="space-y-4">
                {aiRecommendations.map((rec, index) => (
                  <Card key={index} className="bg-accent/5 border-accent/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{rec.service}</h4>
                        <Badge variant="secondary">{rec.confidence}% match</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.vehicle}</p>
                      <p className="text-sm mb-3">{rec.reasoning}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-accent">{rec.estimatedPrice}</span>
                        <Button size="sm" variant="accent">
                          Select & Quote
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setShowRecommendations(false)}>
                  View All Services Instead
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center py-8">
                  Browse available operators on an interactive map and see their real-time availability.
                </p>
                <Link to="/customer/operators">
                  <Button variant="hero" className="w-full" data-testid="button-browse-operators">
                    <Truck className="w-4 h-4 mr-2" />
                    Browse Operators on Map
                  </Button>
                </Link>
                <Link to="/customer">
                  <Button variant="outline" className="w-full">
                    Back to Services
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};