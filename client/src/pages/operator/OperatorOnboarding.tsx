import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Truck, FileText, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const { updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    businessAddress: "",
    licenseNumber: "",
    insuranceProvider: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    licensePlate: "",
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

  const handleFileUpload = (type: string) => {
    toast({
      title: "File uploaded",
      description: `${type} document uploaded successfully`,
    });
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Mark operator profile as complete
    updateUser({ operatorProfileComplete: true });
    
    toast({
      title: "Profile Complete!",
      description: "Welcome to Fleetly. You can now start accepting jobs.",
    });
    
    // Redirect to operator dashboard
    setTimeout(() => {
      setLocation("/operator");
    }, 1500);
  };

  const handleSkip = () => {
    // Mark profile as complete even if they skip
    updateUser({ operatorProfileComplete: true });
    
    toast({
      title: "Welcome to Fleetly!",
      description: "You can complete your profile later from your dashboard.",
    });
    
    // Redirect to operator dashboard
    setLocation("/operator");
  };

  const steps = [
    { number: 1, title: "Business Info", icon: FileText },
    { number: 2, title: "Vehicle Details", icon: Truck },
    { number: 3, title: "Services & Area", icon: Shield },
    { number: 4, title: "Documents", icon: CheckCircle },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Operator Onboarding</h1>
          <p className="text-gray-600 dark:text-gray-400">Complete your profile to start accepting jobs</p>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
          data-testid="button-skip-onboarding"
        >
          Skip for Now →
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted 
                    ? "bg-success text-success-foreground border-success"
                    : isActive 
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-muted text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    isCompleted ? "bg-success" : "bg-muted"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card className="max-w-2xl mx-auto animate-fade-in">
        <CardHeader>
          <CardTitle>Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Tell us about your business"}
            {currentStep === 2 && "Add your vehicle information"}
            {currentStep === 3 && "Select services and coverage area"}
            {currentStep === 4 && "Upload required documents"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Business Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="Mike's Snow Service"
                  />
                </div>
                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    placeholder="Mike Johnson"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="mike@snowservice.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Textarea
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                  placeholder="123 Main Street, Springfield, State 12345"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="licenseNumber">Business License Number</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                  placeholder="BL-123456789"
                />
              </div>
            </div>
          )}

          {/* Step 2: Vehicle Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange("vehicleType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
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
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Model *</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                    placeholder="F-350"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleYear">Year *</Label>
                  <Input
                    id="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={(e) => handleInputChange("vehicleYear", e.target.value)}
                    placeholder="2023"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="licensePlate">License Plate *</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                  placeholder="SNW-123"
                />
              </div>

              <div>
                <Label htmlFor="insuranceProvider">Insurance Provider *</Label>
                <Input
                  id="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                  placeholder="State Farm, Progressive, etc."
                />
              </div>
            </div>
          )}

          {/* Step 3: Services & Area */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Services Offered *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {serviceTypes.map(service => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={formData.services.includes(service)}
                        onCheckedChange={() => handleServiceToggle(service)}
                      />
                      <Label htmlFor={service} className="text-sm">{service}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="serviceArea">Service Area *</Label>
                <Textarea
                  id="serviceArea"
                  value={formData.serviceArea}
                  onChange={(e) => handleInputChange("serviceArea", e.target.value)}
                  placeholder="Springfield metro area, within 25 miles of downtown"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emergencyAvailable"
                  checked={formData.emergencyAvailable}
                  onCheckedChange={(checked) => handleInputChange("emergencyAvailable", checked)}
                />
                <Label htmlFor="emergencyAvailable">Available for emergency/24-hour services</Label>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-2">Commercial Insurance Certificate *</h4>
                  <p className="text-sm text-muted-foreground mb-4">Upload proof of commercial insurance</p>
                  <Button variant="outline" onClick={() => handleFileUpload("Insurance Certificate")}>
                    Upload File
                  </Button>
                </div>

                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-2">Driver's License *</h4>
                  <p className="text-sm text-muted-foreground mb-4">Upload a copy of your driver's license</p>
                  <Button variant="outline" onClick={() => handleFileUpload("Driver's License")}>
                    Upload File
                  </Button>
                </div>

                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="font-medium mb-2">Vehicle Registration</h4>
                  <p className="text-sm text-muted-foreground mb-4">Upload vehicle registration document</p>
                  <Button variant="outline" onClick={() => handleFileUpload("Vehicle Registration")}>
                    Upload File
                  </Button>
                </div>
              </div>

              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <h4 className="font-medium text-accent mb-2">Application Review Process</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Background check (2-3 business days)</li>
                  <li>• Insurance verification</li>
                  <li>• Vehicle inspection scheduling</li>
                  <li>• Account activation notification</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
              className="order-2 sm:order-1"
              data-testid="button-previous-step"
            >
              ← Previous
            </Button>
            
            {currentStep < 4 ? (
              <Button 
                onClick={nextStep} 
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-semibold order-1 sm:order-2"
                size="lg"
                data-testid="button-next-step"
              >
                Next Step →
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 font-semibold order-1 sm:order-2"
                size="lg"
                data-testid="button-submit-application"
              >
                Submit Application ✓
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};