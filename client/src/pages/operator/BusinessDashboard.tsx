import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/enhanced-button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, DollarSign, Star, TrendingUp, Plus, Trash2, Award } from "lucide-react";
import { VehicleManagement } from "@/components/VehicleManagement";
import { useLocation } from "wouter";
import type { Operator, Business } from "@shared/schema";

export const BusinessDashboard = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);
  const setupAttemptedRef = useRef(false);

  // Fetch business data
  const { data: business, isLoading: businessLoading, error: businessError } = useQuery<Business>({
    queryKey: [`/api/business/${user?.businessId}`],
    enabled: !!user?.businessId,
  });

  // Fetch drivers
  const { data: drivers = [], isLoading: driversLoading, error: driversError } = useQuery<Operator[]>({
    queryKey: [`/api/business/drivers/${user?.businessId}`],
    enabled: !!user?.businessId,
  });

  // Fetch operator data for business owner to get online status
  const { data: operatorData } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}`],
    enabled: !!user?.operatorId,
  });

  // Calculate if this tier is currently online
  const isOnline = operatorData?.isOnline === 1 && operatorData?.activeTier === "professional";

  // Business setup mutation for existing operators
  const setupBusinessMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/operators/${user?.operatorId}/setup-business`, {
        method: "POST",
      });
    },
    onSuccess: async (data) => {
      const { businessId } = data;
      
      // Update local user context with businessId from mutation response
      updateUser({ businessId });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: [`/api/business/${businessId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user?.operatorId}`] });
      
      toast({
        title: "Business Created",
        description: "Your business profile has been set up successfully!",
      });
    },
    onError: (error: any) => {
      console.error("Failed to setup business:", error);
      
      // If business already exists (400 error), extract businessId and treat as success
      if (error.message) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.businessId) {
            // Business already exists, use the existing businessId
            updateUser({ businessId: errorData.businessId });
            queryClient.invalidateQueries({ queryKey: [`/api/business/${errorData.businessId}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user?.operatorId}`] });
            toast({
              title: "Business Ready",
              description: "Your business profile is set up and ready to use!",
            });
            return; // Don't show error toast
          }
        } catch (e) {
          // Error message wasn't JSON, continue to show error toast
        }
      }
      
      toast({
        title: "Setup Error",
        description: error.message || "Failed to create business profile. Please contact support.",
        variant: "destructive",
      });
    },
  });

  // Auto-trigger business setup for professional operators without a business
  // Use ref to ensure we only attempt once per component mount
  useEffect(() => {
    if (user?.operatorId && 
        (user.subscribedTiers?.includes("professional") || user.operatorTier === "professional") && 
        !user.businessId &&
        !setupAttemptedRef.current) {
      setupAttemptedRef.current = true;
      setupBusinessMutation.mutate();
    }
  }, [user?.operatorId, user?.businessId]);

  // Online toggle mutation
  const toggleOnlineMutation = useMutation({
    mutationFn: async (goOnline: boolean) => {
      return apiRequest(`/api/operators/${user?.operatorId}/toggle-online`, {
        method: "POST",
        body: JSON.stringify({ 
          isOnline: goOnline ? 1 : 0,
          activeTier: goOnline ? "professional" : null
        }),
      });
    },
    onSuccess: (_, goOnline) => {
      queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user?.operatorId}`] });
      toast({
        title: goOnline ? "You're Online" : "You're Offline",
        description: goOnline 
          ? "You can now receive job requests as a Professional & Certified Operator" 
          : "You won't receive any new job requests",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update online status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add driver mutation
  const addDriverMutation = useMutation({
    mutationFn: async (driverData: any) => {
      return apiRequest("/api/business/drivers", {
        method: "POST",
        body: JSON.stringify(driverData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Driver Added",
        description: "New driver has been added to your team.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/business/drivers/${user?.businessId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business/${user?.businessId}`] });
      setShowAddDriverDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove driver mutation
  const removeDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      return apiRequest(`/api/business/drivers/${driverId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Driver Removed",
        description: "Driver has been removed from your team.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/business/drivers/${user?.businessId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/business/${user?.businessId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove driver. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddDriver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const driverData = {
      businessId: user?.businessId,
      businessName: business?.name,
      driverName: formData.get("driverName"),
      name: business?.name, // Display name for customers
      email: formData.get("email"),
      phone: formData.get("phone"),
      vehicle: formData.get("vehicle"),
      licensePlate: formData.get("licensePlate"),
      services: (formData.get("services") as string).split(",").map(s => s.trim()),
      operatorTier: "professional",
      isCertified: 1,
      businessLicense: business?.businessLicense,
      latitude: "40.7580", // TODO: Use actual business location via geocoding
      longitude: "-73.9855",
      address: business?.address || "",
      homeLatitude: "40.7580",
      homeLongitude: "-73.9855",
    };

    addDriverMutation.mutate(driverData);
  };

  const handleRemoveDriver = (driverId: string, driverName: string) => {
    if (confirm(`Are you sure you want to remove ${driverName} from your team?`)) {
      removeDriverMutation.mutate(driverId);
    }
  };

  // Show loading state while setting up business or loading data
  if (setupBusinessMutation.isPending || businessLoading || driversLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header onDriveAndEarn={() => setLocation("/drive-earn")} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-black dark:text-white">
            {setupBusinessMutation.isPending ? "Setting up your business profile..." : "Loading business dashboard..."}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if business setup failed
  if (setupBusinessMutation.isError && !user?.businessId) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header onDriveAndEarn={() => setLocation("/drive-earn")} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="text-lg text-black dark:text-white">Failed to set up business profile</div>
          <Button 
            onClick={() => {
              setupAttemptedRef.current = false;
              setupBusinessMutation.reset();
              setupBusinessMutation.mutate();
            }}
            data-testid="button-retry-setup"
          >
            Retry Setup
          </Button>
        </div>
      </div>
    );
  }

  // Show error state if business query failed
  if (businessError || (user?.businessId && !business)) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header onDriveAndEarn={() => setLocation("/drive-earn")} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="text-lg text-black dark:text-white">Failed to load business dashboard</div>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: [`/api/business/${user?.businessId}`] });
              queryClient.invalidateQueries({ queryKey: [`/api/business/drivers/${user?.businessId}`] });
            }}
            data-testid="button-retry-load"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // If still no business but no error, show loading (waiting for auto-setup)
  if (!business) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header onDriveAndEarn={() => setLocation("/drive-earn")} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-black dark:text-white">Loading business dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header onDriveAndEarn={() => setLocation("/drive-earn")} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">Professional Business Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unlimited Operating Radius
                </p>
              </div>
            </div>
            
            {/* Online Toggle Button */}
            <Button
              variant={isOnline ? "default" : "outline"}
              size="lg"
              onClick={() => toggleOnlineMutation.mutate(!isOnline)}
              disabled={toggleOnlineMutation.isPending}
              className={`px-8 py-6 rounded-lg font-semibold transition-all ${
                isOnline 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              data-testid="button-toggle-online"
            >
              {toggleOnlineMutation.isPending ? "Updating..." : isOnline ? "Online" : "Offline"}
            </Button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Drivers</p>
                <p className="text-3xl font-bold text-black dark:text-white">{business.totalDrivers}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Jobs</p>
                <p className="text-3xl font-bold text-black dark:text-white">{business.totalJobs}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-black dark:text-white">${business.totalEarnings}</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rating</p>
                <p className="text-3xl font-bold text-black dark:text-white">{parseFloat(business.rating).toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-orange-500 fill-orange-500" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="drivers" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="drivers" data-testid="tab-drivers">Drivers</TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="tab-vehicles">Fleet</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="space-y-6">
        {/* Driver Roster */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black dark:text-white">Your Drivers</h2>
          <Dialog open={showAddDriverDialog} onOpenChange={setShowAddDriverDialog}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" data-testid="button-add-driver">
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-black dark:text-white">Add New Driver</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDriver} className="space-y-4">
                <div>
                  <Label htmlFor="driverName" className="text-black dark:text-white">Driver Name</Label>
                  <Input
                    id="driverName"
                    name="driverName"
                    required
                    className="border-gray-300 dark:border-gray-700"
                    data-testid="input-driver-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-black dark:text-white">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="border-gray-300 dark:border-gray-700"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-black dark:text-white">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    className="border-gray-300 dark:border-gray-700"
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle" className="text-black dark:text-white">Vehicle</Label>
                  <Input
                    id="vehicle"
                    name="vehicle"
                    required
                    className="border-gray-300 dark:border-gray-700"
                    data-testid="input-vehicle"
                  />
                </div>
                <div>
                  <Label htmlFor="licensePlate" className="text-black dark:text-white">License Plate</Label>
                  <Input
                    id="licensePlate"
                    name="licensePlate"
                    required
                    className="border-gray-300 dark:border-gray-700"
                    data-testid="input-license-plate"
                  />
                </div>
                <div>
                  <Label htmlFor="services" className="text-black dark:text-white">Services (comma-separated)</Label>
                  <Input
                    id="services"
                    name="services"
                    placeholder="Snow Plowing, Towing, Hauling"
                    required
                    className="border-gray-300 dark:border-gray-700"
                    data-testid="input-services"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={addDriverMutation.isPending}
                  data-testid="button-submit-driver"
                >
                  {addDriverMutation.isPending ? "Adding..." : "Add Driver"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Driver Cards */}
        {drivers.length === 0 ? (
          <Card className="p-12 text-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg text-black dark:text-white mb-2">No Drivers Yet</p>
            <p className="text-gray-600 dark:text-gray-400">
              Add your first driver to start accepting jobs
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver) => (
              <Card
                key={driver.operatorId}
                className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
                data-testid={`card-driver-${driver.operatorId}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                      {driver.driverName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {driver.vehicle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {driver.licensePlate}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDriver(driver.operatorId, driver.driverName || driver.name)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    data-testid={`button-remove-${driver.operatorId}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Jobs Completed</span>
                    <span className="font-semibold text-black dark:text-white">{driver.totalJobs}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Rating</span>
                    <span className="font-semibold text-black dark:text-white flex items-center">
                      <Star className="w-4 h-4 text-orange-500 fill-orange-500 mr-1" />
                      {parseFloat(driver.rating).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`font-semibold ${driver.isOnline ? "text-green-500" : "text-gray-500"}`}>
                      {driver.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {(driver.services as string[]).map((service, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleManagement tierType="professional" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
