import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, Plus, Edit, Trash2, Check } from "lucide-react";

const serviceTypes = [
  "Snow Plowing",
  "Towing",
  "Hauling",
  "Courier Services",
  "Ice Removal",
  "Roadside Assistance",
  "Equipment Transport",
];

const vehicleTypes = [
  "Pickup Truck",
  "Box Truck",
  "Flatbed Truck",
  "Semi Truck",
  "Tow Truck",
  "Snow Plow",
  "Cargo Van",
  "Dump Truck",
  "Other",
];

const vehicleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(4, "Year is required"),
  licensePlate: z.string().min(1, "License plate is required"),
  services: z.array(z.string()).min(1, "Select at least one service"),
  isActive: z.number().default(0),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleManagementProps {
  tierType: "professional" | "equipped";
}

export function VehicleManagement({ tierType }: VehicleManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      vehicleType: "",
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      services: [],
      isActive: 0,
    },
  });

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/operators/${user?.operatorId}/vehicles`],
    enabled: !!user?.operatorId,
  });

  // Add vehicle mutation
  const addVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      return apiRequest(`/api/operators/${user?.operatorId}/vehicles`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${user?.operatorId}/vehicles`] });
      toast({ title: "Vehicle Added", description: "Your vehicle has been added successfully." });
      setShowAddDialog(false);
      form.reset();
    },
  });

  // Update vehicle mutation
  const updateVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId, data }: { vehicleId: string; data: Partial<VehicleFormData> }) => {
      return apiRequest(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${user?.operatorId}/vehicles`] });
      toast({ title: "Vehicle Updated", description: "Vehicle updated successfully." });
      setEditingVehicle(null);
    },
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      return apiRequest(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${user?.operatorId}/vehicles`] });
      toast({ title: "Vehicle Deleted", description: "Vehicle removed successfully." });
    },
  });

  // Set active vehicle mutation (equipped tier only)
  const setActiveVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      return apiRequest(`/api/operators/${user?.operatorId}/vehicles/${vehicleId}/set-active`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${user?.operatorId}/vehicles`] });
      toast({ title: "Active Vehicle Updated", description: "Your active vehicle has been changed." });
    },
  });

  const handleSubmit = (values: VehicleFormData) => {
    if (editingVehicle) {
      updateVehicleMutation.mutate({ vehicleId: editingVehicle.vehicleId, data: values });
    } else {
      addVehicleMutation.mutate(values);
    }
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    form.reset({
      name: vehicle.name,
      vehicleType: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      services: vehicle.services,
      isActive: vehicle.isActive,
    });
    setShowAddDialog(true);
  };

  const handleServiceToggle = (service: string, currentServices: string[]) => {
    const newServices = currentServices.includes(service)
      ? currentServices.filter((s) => s !== service)
      : [...currentServices, service];
    return newServices;
  };

  if (isLoading) {
    return <div>Loading vehicles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Vehicle Fleet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {tierType === "equipped" 
              ? "Manage your vehicles. Only one can be active at a time."
              : "Manage your fleet. All vehicles can be used simultaneously."}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingVehicle(null);
            form.reset();
            setShowAddDialog(true);
          }}
          className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          data-testid="button-add-vehicle"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <Card
            key={vehicle.vehicleId}
            className={`${
              tierType === "equipped" && vehicle.isActive
                ? "ring-2 ring-green-500 dark:ring-green-400"
                : ""
            }`}
            data-testid={`card-vehicle-${vehicle.vehicleId}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                </div>
                {tierType === "equipped" && vehicle.isActive && (
                  <Badge className="bg-green-500 text-white">Active</Badge>
                )}
              </div>
              <CardDescription>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-medium">{vehicle.vehicleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plate:</span>
                  <span className="font-medium">{vehicle.licensePlate}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Services:</p>
                <div className="flex flex-wrap gap-1">
                  {vehicle.services.map((service: string) => (
                    <Badge key={service} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {tierType === "equipped" && !vehicle.isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveVehicleMutation.mutate(vehicle.vehicleId)}
                    className="flex-1"
                    data-testid={`button-activate-${vehicle.vehicleId}`}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Set Active
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(vehicle)}
                  data-testid={`button-edit-${vehicle.vehicleId}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteVehicleMutation.mutate(vehicle.vehicleId)}
                  data-testid={`button-delete-${vehicle.vehicleId}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {vehicles.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No vehicles added yet</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                variant="outline"
                data-testid="button-add-first-vehicle"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
            <DialogDescription>
              Enter vehicle details and select the services it can perform.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Truck #1" data-testid="input-vehicle-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-vehicle-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ford" data-testid="input-make" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="F-350" data-testid="input-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="2023" data-testid="input-year" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC-123" data-testid="input-license-plate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services This Vehicle Can Perform</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {serviceTypes.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            checked={field.value.includes(service)}
                            onCheckedChange={(checked) => {
                              const newServices = handleServiceToggle(service, field.value);
                              field.onChange(newServices);
                            }}
                            data-testid={`checkbox-service-${service}`}
                          />
                          <label
                            htmlFor={service}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {service}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingVehicle(null);
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addVehicleMutation.isPending || updateVehicleMutation.isPending}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 flex-1"
                  data-testid="button-submit-vehicle"
                >
                  {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
