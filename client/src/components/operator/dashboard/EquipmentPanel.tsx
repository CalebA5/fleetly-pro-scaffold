import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wrench, Truck, Plus, CheckCircle,
  Settings, Clock, Edit2, Trash2, Lock
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { OperatorTier } from "@shared/schema";
import { TIER_CAPABILITIES, EQUIPMENT_TYPES, EQUIPMENT_STATUSES, getEquipmentForTier } from "@shared/tierCapabilities";
import type { EquipmentStatus } from "@shared/tierCapabilities";

interface Equipment {
  id: string;
  type: string;
  name: string;
  category: "tool" | "vehicle" | "heavy_equipment";
  status: EquipmentStatus;
  photo?: string;
  verified: boolean;
  assignedTo?: string;
  lastServiceDate?: string;
}

interface EquipmentPanelProps {
  tier: OperatorTier;
  operatorId: string;
}

export function EquipmentPanel({ tier, operatorId }: EquipmentPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("tools");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"tools" | "vehicles" | "heavyEquipment">("tools");

  const tierInfo = TIER_CAPABILITIES[tier];
  const canAddVehicles = tier !== "manual";
  const canAddHeavyEquipment = tier !== "manual";

  const { data: rawEquipment, isLoading } = useQuery<Equipment[] | { equipmentInventory: Equipment[] }>({
    queryKey: [`/api/operators/${operatorId}/equipment`],
    enabled: !!operatorId,
  });
  
  // Handle both array and object responses safely
  const equipment: Equipment[] = Array.isArray(rawEquipment) 
    ? rawEquipment 
    : (rawEquipment as any)?.equipmentInventory || [];
  
  const openAddDialogWithCategory = (category: "tools" | "vehicles" | "heavyEquipment") => {
    setSelectedCategory(category);
    setAddDialogOpen(true);
  };

  const tools = equipment.filter(e => e.category === "tool");
  const vehicles = equipment.filter(e => e.category === "vehicle");
  const heavyEquipment = equipment.filter(e => e.category === "heavy_equipment");

  const availableTools = getEquipmentForTier(tier, "tools");
  const availableVehicles = getEquipmentForTier(tier, "vehicles");
  const availableHeavyEquipment = getEquipmentForTier(tier, "heavyEquipment");

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Maintenance</Badge>;
      case "reserved":
        return <Badge className="bg-blue-500 text-white">Reserved</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-4" data-testid="equipment-panel">
      <div className="mb-2">
        <h2 className="text-lg font-semibold">Equipment Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage your tools, vehicles, and equipment
        </p>
      </div>
      
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
            <DialogDescription>
              Add new tools or equipment to your inventory.
            </DialogDescription>
          </DialogHeader>
          <AddEquipmentForm
            tier={tier}
            operatorId={operatorId}
            availableTools={availableTools}
            availableVehicles={availableVehicles}
            availableHeavyEquipment={availableHeavyEquipment}
            canAddVehicles={canAddVehicles}
            canAddHeavyEquipment={canAddHeavyEquipment}
            initialCategory={selectedCategory}
            onClose={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="tools" data-testid="equipment-subtab-tools">
            <Wrench className="h-4 w-4 mr-2" />
            Tools ({tools.length})
          </TabsTrigger>
          <TabsTrigger 
            value="vehicles" 
            disabled={!canAddVehicles}
            data-testid="equipment-subtab-vehicles"
          >
            <Truck className="h-4 w-4 mr-2" />
            Vehicles ({vehicles.length})
            {!canAddVehicles && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger 
            value="heavy" 
            disabled={!canAddHeavyEquipment}
            data-testid="equipment-subtab-heavy"
          >
            <Settings className="h-4 w-4 mr-2" />
            Heavy ({heavyEquipment.length})
            {!canAddHeavyEquipment && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : tools.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No Tools Added"
              description="Add your tools and equipment to start accepting jobs that require them."
              actionLabel="Add Tool"
              onAction={() => openAddDialogWithCategory("tools")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tools.map((tool) => (
                <EquipmentCard key={tool.id} equipment={tool} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4">
          {!canAddVehicles ? (
            <LockedFeatureCard
              title="Vehicles"
              description="Upgrade to Skilled & Equipped tier to add vehicles."
            />
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No Vehicles Added"
              description={`You can add up to ${tierInfo.equipmentLimits.maxVehicles} vehicles.`}
              actionLabel="Add Vehicle"
              onAction={() => openAddDialogWithCategory("vehicles")}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {vehicles.length} of {tierInfo.equipmentLimits.maxVehicles} vehicles
                </p>
                {!tierInfo.equipmentLimits.multipleEquipmentPerJob && (
                  <Badge variant="outline" className="text-xs">
                    1 vehicle per job
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map((vehicle) => (
                  <EquipmentCard key={vehicle.id} equipment={vehicle} isVehicle />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="heavy" className="mt-4">
          {!canAddHeavyEquipment ? (
            <LockedFeatureCard
              title="Heavy Equipment"
              description="Upgrade to Skilled & Equipped tier to add heavy equipment."
            />
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : heavyEquipment.length === 0 ? (
            <EmptyState
              icon={Settings}
              title="No Heavy Equipment"
              description="Add plows, trailers, and other heavy equipment."
              actionLabel="Add Equipment"
              onAction={() => openAddDialogWithCategory("heavyEquipment")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {heavyEquipment.map((item) => (
                <EquipmentCard key={item.id} equipment={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EquipmentCard({ 
  equipment, 
  isVehicle = false 
}: { 
  equipment: Equipment;
  isVehicle?: boolean;
}) {
  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Active</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Maintenance</Badge>;
      case "reserved":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Reserved</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden" data-testid={`equipment-card-${equipment.id}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {equipment.photo ? (
              <img 
                src={equipment.photo} 
                alt={equipment.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground">
                {isVehicle ? <Truck className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm truncate">{equipment.name}</h4>
                <p className="text-xs text-muted-foreground">{equipment.type}</p>
              </div>
              {getStatusBadge(equipment.status)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {equipment.verified ? (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
              {equipment.assignedTo && (
                <span className="text-xs text-muted-foreground">
                  Assigned: {equipment.assignedTo}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="flex-1" data-testid={`edit-equipment-${equipment.id}`}>
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" data-testid={`delete-equipment-${equipment.id}`}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: {
  icon: any;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function LockedFeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed opacity-60">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">{title} Locked</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function AddEquipmentForm({
  tier,
  operatorId,
  availableTools,
  availableVehicles,
  availableHeavyEquipment,
  canAddVehicles,
  canAddHeavyEquipment,
  initialCategory,
  onClose,
}: {
  tier: OperatorTier;
  operatorId: string;
  availableTools: any[];
  availableVehicles: any[];
  availableHeavyEquipment: any[];
  canAddVehicles: boolean;
  canAddHeavyEquipment: boolean;
  initialCategory: "tools" | "vehicles" | "heavyEquipment";
  onClose: () => void;
}) {
  const categoryMap = { tools: "tools", vehicles: "vehicles", heavyEquipment: "heavy" };
  const [category, setCategory] = useState<string>(categoryMap[initialCategory]);
  const [equipmentType, setEquipmentType] = useState<string>("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentOptions = category === "tools" 
    ? availableTools 
    : category === "vehicles" 
    ? availableVehicles 
    : availableHeavyEquipment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentType) return;
    
    setIsSubmitting(true);
    try {
      const selectedEquipment = currentOptions.find(item => item.id === equipmentType);
      const equipmentData = {
        id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: equipmentType,
        name: name || selectedEquipment?.name || equipmentType,
        category: category === "tools" ? "tool" : category === "vehicles" ? "vehicle" : "heavy_equipment",
        status: "active" as const,
        verified: false,
      };
      
      await apiRequest(`/api/operators/${operatorId}/equipment`, {
        method: "POST",
        body: JSON.stringify(equipmentData),
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${operatorId}/equipment`] });
      onClose();
    } catch (error) {
      console.error("Error adding equipment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-testid="equipment-category-select">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tools">Tools</SelectItem>
            <SelectItem value="vehicles" disabled={!canAddVehicles}>
              Vehicles {!canAddVehicles && "🔒"}
            </SelectItem>
            <SelectItem value="heavy" disabled={!canAddHeavyEquipment}>
              Heavy Equipment {!canAddHeavyEquipment && "🔒"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Equipment Type</Label>
        <Select value={equipmentType} onValueChange={setEquipmentType}>
          <SelectTrigger data-testid="equipment-type-select">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {currentOptions.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Custom Name (Optional)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My Snow Blower"
          data-testid="equipment-name-input"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" data-testid="save-equipment-btn" disabled={isSubmitting || !equipmentType}>
          {isSubmitting ? "Adding..." : "Add Equipment"}
        </Button>
      </div>
    </form>
  );
}
