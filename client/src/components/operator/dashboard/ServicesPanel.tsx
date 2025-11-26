import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, Settings, CheckCircle, Clock, AlertCircle, Lock,
  DollarSign, Star, FileText, Upload, Trash2, Edit2, Info
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { OperatorTier } from "@shared/schema";
import { TIER_CAPABILITIES, TIER_SERVICES, getServicesForTier } from "@shared/tierCapabilities";
import type { ServiceConfig } from "@shared/tierCapabilities";

interface OperatorService {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  isActive: boolean;
  skillLevel: "beginner" | "intermediate" | "expert";
  basePrice: number;
  priceType: "hourly" | "fixed" | "quote";
  certificationUploaded?: boolean;
  certificationVerified?: boolean;
  toolPhotosUploaded?: boolean;
}

interface ServicesPanelProps {
  tier: OperatorTier;
  operatorId: string;
}

export function ServicesPanel({ tier, operatorId }: ServicesPanelProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string>("");
  const [editingService, setEditingService] = useState<OperatorService | null>(null);

  const tierInfo = TIER_CAPABILITIES[tier];
  const availableServices = getServicesForTier(tier);

  const handleAddService = (serviceId?: string) => {
    setPreSelectedServiceId(serviceId || "");
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setPreSelectedServiceId("");
  };

  const { data: operatorServices = [], isLoading } = useQuery<OperatorService[]>({
    queryKey: [`/api/operators/${operatorId}/services`],
    enabled: !!operatorId,
  });
  
  const toggleServiceMutation = useMutation({
    mutationFn: async ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) => {
      return apiRequest(`/api/operators/${operatorId}/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${operatorId}/services`] });
    },
  });

  const microServices = availableServices.filter(s => s.category === "micro");
  const standardServices = availableServices.filter(s => s.category === "standard");
  const professionalServices = availableServices.filter(s => s.category === "professional");

  const addedServiceIds = operatorServices.map(s => s.serviceId);

  return (
    <div className="space-y-6" data-testid="services-panel">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Services & Pricing</h2>
          <p className="text-sm text-muted-foreground">
            Manage the services you offer and set your pricing
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          if (!open) handleCloseAddDialog();
          else setAddDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-service-btn" onClick={() => handleAddService()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Service</DialogTitle>
              <DialogDescription>
                Choose a service to add to your profile. Some services require certification.
              </DialogDescription>
            </DialogHeader>
            <AddServiceForm
              tier={tier}
              operatorId={operatorId}
              availableServices={availableServices}
              addedServiceIds={addedServiceIds}
              preSelectedServiceId={preSelectedServiceId}
              onClose={handleCloseAddDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : operatorServices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">No Services Added</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Add services you want to offer to customers. You can set your own pricing and skill level.
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {operatorServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => setEditingService(service)}
              onToggle={(isActive) => toggleServiceMutation.mutate({ serviceId: service.id, isActive })}
              isToggling={toggleServiceMutation.isPending}
            />
          ))}
        </div>
      )}

      <Separator />

      <div>
        <h3 className="font-semibold mb-4">Available Services for Your Tier</h3>
        
        {microServices.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Micro Services
              </Badge>
              <span className="text-xs">Available to all tiers</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {microServices.map((service) => (
                <AvailableServiceCard
                  key={service.id}
                  service={service}
                  isAdded={addedServiceIds.includes(service.id)}
                  onAdd={() => handleAddService(service.id)}
                />
              ))}
            </div>
          </div>
        )}

        {standardServices.length > 0 && tier !== "manual" && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Standard Services
              </Badge>
              <span className="text-xs">Skilled & Equipped tier and above</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {standardServices.map((service) => (
                <AvailableServiceCard
                  key={service.id}
                  service={service}
                  isAdded={addedServiceIds.includes(service.id)}
                  onAdd={() => handleAddService(service.id)}
                />
              ))}
            </div>
          </div>
        )}

        {professionalServices.length > 0 && tier === "professional" && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Professional Services
              </Badge>
              <span className="text-xs">Professional tier only</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {professionalServices.map((service) => (
                <AvailableServiceCard
                  key={service.id}
                  service={service}
                  isAdded={addedServiceIds.includes(service.id)}
                  onAdd={() => handleAddService(service.id)}
                />
              ))}
            </div>
          </div>
        )}

        {tier === "manual" && standardServices.length > 0 && (
          <Card className="border-dashed opacity-70">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">More Services Available</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrade to Skilled & Equipped tier to unlock {standardServices.length} more services
                    including snow plowing, towing, and hauling.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {editingService && (
        <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
            </DialogHeader>
            <EditServiceForm
              service={editingService}
              operatorId={operatorId}
              onClose={() => setEditingService(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ServiceCard({ 
  service, 
  onEdit,
  onToggle,
  isToggling
}: { 
  service: OperatorService;
  onEdit: () => void;
  onToggle: (isActive: boolean) => void;
  isToggling: boolean;
}) {
  const getSkillBadge = (level: string) => {
    switch (level) {
      case "beginner":
        return <Badge variant="outline" className="text-xs">Beginner</Badge>;
      case "intermediate":
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Intermediate</Badge>;
      case "expert":
        return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Expert</Badge>;
    }
  };

  return (
    <Card className={`overflow-hidden ${!service.isActive && "opacity-60"}`} data-testid={`service-card-${service.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{service.name}</h4>
              {getSkillBadge(service.skillLevel)}
              {!service.isActive && <Badge variant="secondary">Inactive</Badge>}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {service.description}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 font-medium">
                <DollarSign className="h-4 w-4 text-green-600" />
                ${service.basePrice}
                <span className="text-muted-foreground font-normal">
                  /{service.priceType === "hourly" ? "hr" : service.priceType}
                </span>
              </span>
              {service.certificationVerified && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Certified
                </span>
              )}
              {service.toolPhotosUploaded && (
                <span className="flex items-center gap-1 text-blue-600">
                  <CheckCircle className="h-4 w-4" />
                  Tools Verified
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Switch 
              checked={service.isActive} 
              onCheckedChange={onToggle}
              disabled={isToggling}
              data-testid={`toggle-service-${service.id}`} 
            />
            <Button variant="outline" size="sm" onClick={onEdit} data-testid={`edit-service-${service.id}`}>
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AvailableServiceCard({
  service,
  isAdded,
  onAdd,
}: {
  service: ServiceConfig;
  isAdded: boolean;
  onAdd: () => void;
}) {
  return (
    <Card 
      className={`overflow-hidden transition-all ${
        isAdded ? "opacity-50" : "hover:shadow-md cursor-pointer"
      }`}
      onClick={!isAdded ? onAdd : undefined}
      data-testid={`available-service-${service.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-medium text-sm truncate">{service.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
          </div>
          {isAdded ? (
            <Badge variant="secondary" className="text-xs shrink-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Added
            </Badge>
          ) : (
            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
        {(service.requiresCertification || service.requiresBusinessLicense) && (
          <div className="flex items-center gap-2 mt-2">
            {service.requiresCertification && (
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Cert Required
              </Badge>
            )}
            {service.requiresBusinessLicense && (
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                License Required
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddServiceForm({
  tier,
  operatorId,
  availableServices,
  addedServiceIds,
  preSelectedServiceId = "",
  onClose,
}: {
  tier: OperatorTier;
  operatorId: string;
  availableServices: ServiceConfig[];
  addedServiceIds: string[];
  preSelectedServiceId?: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preSelectedServiceId);
  const [skillLevel, setSkillLevel] = useState<string>("intermediate");
  const [priceType, setPriceType] = useState<string>("hourly");
  const [basePrice, setBasePrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = availableServices.find(s => s.id === selectedServiceId);
  const notAddedServices = availableServices.filter(s => !addedServiceIds.includes(s.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !basePrice) return;
    
    setIsSubmitting(true);
    try {
      const serviceData = {
        serviceId: selectedServiceId,
        name: selectedService.name,
        description: description || selectedService.description,
        isActive: true,
        skillLevel: skillLevel as "beginner" | "intermediate" | "expert",
        basePrice: parseFloat(basePrice),
        priceType: priceType as "hourly" | "fixed" | "quote",
        certificationUploaded: false,
        certificationVerified: false,
        toolPhotosUploaded: false,
      };
      
      await apiRequest(`/api/operators/${operatorId}/services`, {
        method: "POST",
        body: JSON.stringify(serviceData),
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${operatorId}/services`] });
      
      toast({
        title: "Service Added",
        description: `${selectedService.name} has been added to your services.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error adding service:", error);
      toast({
        title: "Failed to Add Service",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Select Service</Label>
        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
          <SelectTrigger data-testid="service-select">
            <SelectValue placeholder="Choose a service to add" />
          </SelectTrigger>
          <SelectContent>
            {notAddedServices.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex items-center gap-2">
                  <span>{service.name}</span>
                  {service.requiresCertification && (
                    <Badge variant="outline" className="text-xs ml-2">Cert</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedService && (
        <>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{selectedService.description}</p>
            {(selectedService.requiresCertification || selectedService.requiresBusinessLicense) && (
              <div className="flex items-center gap-2 mt-2">
                <Info className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-600">
                  {selectedService.requiresCertification && "Certification required. "}
                  {selectedService.requiresBusinessLicense && "Business license required."}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Skill Level</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger data-testid="skill-level-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pricing Type</Label>
              <Select value={priceType} onValueChange={setPriceType}>
                <SelectTrigger data-testid="price-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="quote">Custom Quote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Base Price ($)</Label>
            <Input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder={priceType === "hourly" ? "e.g., 50" : "e.g., 150"}
              data-testid="base-price-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your experience or any special skills..."
              rows={3}
              data-testid="service-notes-input"
            />
          </div>

          {selectedService.requiresCertification && (
            <div className="space-y-2">
              <Label>Upload Certification</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload your certification
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={!selectedServiceId || !basePrice || isSubmitting}
          data-testid="save-service-btn"
        >
          {isSubmitting ? "Adding..." : "Add Service"}
        </Button>
      </div>
    </form>
  );
}

function EditServiceForm({
  service,
  operatorId,
  onClose,
}: {
  service: OperatorService;
  operatorId: string;
  onClose: () => void;
}) {
  const [skillLevel, setSkillLevel] = useState(service.skillLevel);
  const [priceType, setPriceType] = useState(service.priceType);
  const [basePrice, setBasePrice] = useState(service.basePrice.toString());
  const [isActive, setIsActive] = useState(service.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/operators/${operatorId}/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          skillLevel,
          priceType,
          basePrice: parseFloat(basePrice),
          isActive,
        }),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${operatorId}/services`] });
      onClose();
    } catch (error) {
      console.error("Error updating service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiRequest(`/api/operators/${operatorId}/services/${service.id}`, {
        method: "DELETE",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/operators/${operatorId}/services`] });
      onClose();
    } catch (error) {
      console.error("Error deleting service:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{service.name}</h4>
        <div className="flex items-center gap-2">
          <Label htmlFor="service-active" className="text-sm">Active</Label>
          <Switch
            id="service-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Skill Level</Label>
          <Select value={skillLevel} onValueChange={(v: any) => setSkillLevel(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pricing Type</Label>
          <Select value={priceType} onValueChange={(v: any) => setPriceType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly Rate</SelectItem>
              <SelectItem value="fixed">Fixed Price</SelectItem>
              <SelectItem value="quote">Custom Quote</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Base Price ($)</Label>
        <Input
          type="number"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting || isDeleting}>
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="destructive" 
          onClick={handleDelete}
          className="flex-1"
          disabled={isSubmitting || isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? "Removing..." : "Remove"}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting || isDeleting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
