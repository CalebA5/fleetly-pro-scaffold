import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Plus, UserPlus, Star, Briefcase, Clock, Settings,
  MoreVertical, Trash2, Edit2, Key, Ban, CheckCircle, 
  AlertCircle, Phone, Mail, Car
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { OperatorTier } from "@shared/schema";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  status: "active" | "inactive" | "suspended";
  rating: number;
  totalJobs: number;
  activeJobs: number;
  assignedVehicle?: string;
  assignedEquipment?: string[];
  permissions: string[];
  createdAt: string;
  lastActiveAt?: string;
}

interface ManpowerPanelProps {
  tier: OperatorTier;
  operatorId: string;
  businessId?: string;
}

export function ManpowerPanel({ tier, operatorId, businessId }: ManpowerPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("drivers");
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ["/api/operators", operatorId, "drivers"],
    enabled: tier === "professional",
  });

  const activeDrivers = drivers.filter(d => d.status === "active");
  const inactiveDrivers = drivers.filter(d => d.status === "inactive");
  const suspendedDrivers = drivers.filter(d => d.status === "suspended");

  if (tier !== "professional") {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Manpower Management</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upgrade to Professional tier to manage multiple drivers and assign jobs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="manpower-panel">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Driver Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage your drivers, assign jobs, and track performance
          </p>
        </div>
        <Dialog open={addDriverOpen} onOpenChange={setAddDriverOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-driver-btn">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
              <DialogDescription>
                Create a driver account for your team member.
              </DialogDescription>
            </DialogHeader>
            <AddDriverForm onClose={() => setAddDriverOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Drivers</p>
            </div>
            <p className="text-2xl font-bold">{drivers.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{activeDrivers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">On Jobs</p>
            </div>
            <p className="text-2xl font-bold">
              {drivers.reduce((sum, d) => sum + d.activeJobs, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
            <p className="text-2xl font-bold">
              {(drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length || 0).toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="drivers" data-testid="manpower-subtab-drivers">
            All Drivers ({drivers.length})
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="manpower-subtab-performance">
            Performance
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="manpower-subtab-assignments">
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">No Drivers Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  Add drivers to your team to assign jobs and manage your fleet more efficiently.
                </p>
                <Button onClick={() => setAddDriverOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Driver
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {drivers.map((driver) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    onEdit={() => setEditingDriver(driver)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <h3 className="font-medium mb-1">Performance Analytics</h3>
              <p className="text-sm">Detailed driver performance metrics coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <h3 className="font-medium mb-1">Job Assignments</h3>
              <p className="text-sm">Assign vehicles and equipment to drivers here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editingDriver && (
        <Dialog open={!!editingDriver} onOpenChange={() => setEditingDriver(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Driver</DialogTitle>
            </DialogHeader>
            <EditDriverForm
              driver={editingDriver}
              onClose={() => setEditingDriver(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function DriverCard({ 
  driver, 
  onEdit 
}: { 
  driver: Driver;
  onEdit: () => void;
}) {
  const getStatusBadge = (status: Driver["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden" data-testid={`driver-card-${driver.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={driver.photo} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {driver.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-medium truncate">{driver.name}</h4>
                <p className="text-xs text-muted-foreground">{driver.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(driver.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Car className="h-4 w-4 mr-2" />
                      Assign Vehicle
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {driver.status === "active" ? (
                      <DropdownMenuItem className="text-destructive">
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend Driver
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Reactivate Driver
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {driver.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                {driver.totalJobs} jobs
              </span>
              {driver.activeJobs > 0 && (
                <Badge variant="outline" className="text-xs">
                  {driver.activeJobs} active
                </Badge>
              )}
              {driver.assignedVehicle && (
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Car className="h-3 w-3" />
                  {driver.assignedVehicle}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddDriverForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Smith"
          required
          data-testid="driver-name-input"
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          required
          data-testid="driver-email-input"
        />
      </div>

      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          required
          data-testid="driver-phone-input"
        />
      </div>

      <div className="space-y-2">
        <Label>Temporary Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          required
          data-testid="driver-password-input"
        />
        <p className="text-xs text-muted-foreground">
          The driver will be prompted to change this on first login.
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" data-testid="save-driver-btn">
          Create Driver Account
        </Button>
      </div>
    </form>
  );
}

function EditDriverForm({ 
  driver, 
  onClose 
}: { 
  driver: Driver;
  onClose: () => void;
}) {
  const [name, setName] = useState(driver.name);
  const [email, setEmail] = useState(driver.email);
  const [phone, setPhone] = useState(driver.phone);
  const [status, setStatus] = useState(driver.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="destructive" 
          onClick={onClose}
          className="flex-1"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove
        </Button>
        <Button type="submit" className="flex-1">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
