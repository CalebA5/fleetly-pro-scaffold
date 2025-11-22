import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, MapPin, DollarSign, Clock, ChevronDown, MessageCircle, Phone, CheckCircle, Minimize2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Checkbox } from "@/components/ui/checkbox";

export interface CustomerGroup {
  id: string;
  location: string;
  customerCount: number;
  totalValue: string;
  customers: Array<{
    name: string;
    address: string;
    service: string;
  }>;
  distance: number;
  expiresIn: number; // minutes
}

interface CustomerGroupingProps {
  groups: CustomerGroup[];
  onAcceptGroup?: (groupId: string) => void;
  onAcceptCustomers?: (groupId: string, customerIndices: number[]) => void; // For selective acceptance
  onContactGroup?: (groupId: string, message: string) => void;
  acceptedGroupIds?: string[]; // Allow parents to manage accepted state
  operatorJobCount?: number; // Number of completed jobs operator has
  minimumJobsRequired?: number; // Minimum jobs needed to unlock customer grouping
}

export function CustomerGrouping({ 
  groups, 
  onAcceptGroup,
  onAcceptCustomers, 
  onContactGroup, 
  acceptedGroupIds = [],
  operatorJobCount = 0,
  minimumJobsRequired = 5
}: CustomerGroupingProps) {
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [minimizedGroups, setMinimizedGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  // Track selected customers per group: Map<groupId, Set<customerIndex>>
  const [selectedCustomers, setSelectedCustomers] = useState<Map<string, Set<number>>>(new Map());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleAcceptGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Let parent manage accepted state
    if (onAcceptGroup) {
      onAcceptGroup(groupId);
    }
  };

  const handleMinimizeGroup = (groupId: string) => {
    setMinimizedGroups(prev => [...prev, groupId]);
    toast({
      title: "Group Minimized",
      description: "This customer group has been hidden from your view",
    });
  };

  const toggleCustomerSelection = (groupId: string, customerIndex: number) => {
    setSelectedCustomers(prev => {
      const newMap = new Map(prev);
      const groupSelections = new Set(newMap.get(groupId) || []);
      
      if (groupSelections.has(customerIndex)) {
        groupSelections.delete(customerIndex);
      } else {
        groupSelections.add(customerIndex);
      }
      
      if (groupSelections.size === 0) {
        newMap.delete(groupId);
      } else {
        newMap.set(groupId, groupSelections);
      }
      
      return newMap;
    });
  };

  const handleAcceptSelected = (groupId: string) => {
    const selectedSet = selectedCustomers.get(groupId);
    const group = groups.find(g => g.id === groupId);
    
    if (!selectedSet || selectedSet.size === 0 || !group) {
      toast({
        title: "No customers selected",
        description: "Please select at least one customer to accept",
        variant: "destructive",
      });
      return;
    }

    const selectedIndices = Array.from(selectedSet);

    // If all customers selected, use accept group instead
    if (selectedSet.size === group.customerCount) {
      if (onAcceptGroup) {
        onAcceptGroup(groupId);
      }
      toast({
        title: "All Customers Accepted",
        description: `Accepted all ${group.customerCount} customers from this group`,
      });
    } else {
      // Selective acceptance callback
      if (onAcceptCustomers) {
        onAcceptCustomers(groupId, selectedIndices);
      }
      toast({
        title: "Customers Accepted",
        description: `Accepted ${selectedSet.size} of ${group.customerCount} customers`,
      });
    }

    // Clear selections for this group
    setSelectedCustomers(prev => {
      const newMap = new Map(prev);
      newMap.delete(groupId);
      return newMap;
    });
  };

  const selectAllCustomers = (groupId: string, customerCount: number) => {
    setSelectedCustomers(prev => {
      const newMap = new Map(prev);
      const allIndices = new Set(Array.from({ length: customerCount }, (_, i) => i));
      newMap.set(groupId, allIndices);
      return newMap;
    });
  };

  const deselectAllCustomers = (groupId: string) => {
    setSelectedCustomers(prev => {
      const newMap = new Map(prev);
      newMap.delete(groupId);
      return newMap;
    });
  };

  const handleContactGroup = () => {
    if (!selectedGroup) return;
    
    toast({
      title: "Message Sent",
      description: `Contacted ${selectedGroup.customerCount} customers`,
    });
    
    if (onContactGroup) {
      onContactGroup(selectedGroup.id, contactMessage);
    }
    
    setContactMessage("");
    setSelectedGroup(null);
  };

  // Check if operator has unlocked customer grouping
  const hasUnlockedGrouping = operatorJobCount >= minimumJobsRequired;

  // Filter out accepted and minimized groups
  const availableGroups = groups.filter(g => 
    !acceptedGroupIds.includes(g.id) && !minimizedGroups.includes(g.id)
  );

  // Show locked state if operator hasn't completed enough jobs
  if (!hasUnlockedGrouping) {
    return (
      <Card className="border-dashed bg-gray-50 dark:bg-gray-900/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 text-center font-semibold">
            Customer Grouping Locked
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 text-center max-w-md">
            Complete {minimumJobsRequired} jobs to unlock customer grouping and boost your earnings by accepting multiple customers at once
          </p>
          <div className="mt-4 bg-white dark:bg-black rounded-lg p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    {operatorJobCount}/{minimumJobsRequired} jobs
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${(operatorJobCount / minimumJobsRequired) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableGroups.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center">
            No customer groupings available yet
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {groups.length > 0 
              ? minimizedGroups.length > 0 
                ? `${minimizedGroups.length} group${minimizedGroups.length > 1 ? 's' : ''} minimized`
                : "All groups have been accepted!" 
              : "Groups will appear when multiple customers in same area request services"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Mobile: Use Sheet (bottom drawer)
  // Desktop: Use inline expandable cards
  return (
    <div className="space-y-3">
      {availableGroups.map((group) => {
        const isExpanded = expandedGroups.includes(group.id);
        const isAccepted = acceptedGroupIds.includes(group.id);

        const GroupCard = (
          <Card 
            key={group.id}
            className={`border transition-all ${
              isAccepted 
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                : 'hover:border-orange-300 dark:hover:border-orange-700'
            }`}
            data-testid={`group-card-${group.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    {group.location}
                    {isAccepted && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline" className="font-normal">
                      <Users className="h-3 w-3 mr-1" />
                      {group.customerCount} customers
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {group.totalValue}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      <MapPin className="h-3 w-3 mr-1" />
                      {group.distance} mi
                    </Badge>
                    <Badge 
                      variant={group.expiresIn < 15 ? "destructive" : "secondary"}
                      className="font-normal"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {group.expiresIn} min
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              {/* Mobile: Sheet Trigger */}
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      data-testid={`button-view-details-${group.id}`}
                    >
                      View {group.customerCount} Customers
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {group.location}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 mb-2 flex items-center justify-between px-1">
                      <span className="text-sm text-muted-foreground">
                        {selectedCustomers.get(group.id)?.size || 0} of {group.customerCount} selected
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectAllCustomers(group.id, group.customerCount)}
                          data-testid={`button-select-all-${group.id}`}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deselectAllCustomers(group.id)}
                          data-testid={`button-deselect-all-${group.id}`}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-3 overflow-y-auto max-h-[calc(80vh-240px)]">
                      {group.customers.map((customer, idx) => {
                        const isSelected = selectedCustomers.get(group.id)?.has(idx) || false;
                        return (
                          <Card 
                            key={idx} 
                            className={`border-l-4 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/30' 
                                : 'border-l-gray-300 dark:border-l-gray-700'
                            }`}
                            onClick={() => toggleCustomerSelection(group.id, idx)}
                            data-testid={`card-customer-${group.id}-${idx}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox 
                                  checked={isSelected}
                                  onCheckedChange={() => toggleCustomerSelection(group.id, idx)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1"
                                  data-testid={`checkbox-customer-${group.id}-${idx}`}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{customer.name}</div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {customer.address}
                                  </div>
                                  <Badge variant="secondary" className="mt-2 text-xs">
                                    {customer.service}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMinimizeGroup(group.id)}
                        className="px-3"
                        data-testid={`button-minimize-${group.id}`}
                      >
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setSelectedGroup(group)}
                            data-testid={`button-contact-${group.id}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Contact Customers</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <p className="text-sm text-muted-foreground">
                              Send a message to all {selectedGroup?.customerCount} customers in this group
                            </p>
                            <Textarea
                              placeholder="Type your message here..."
                              value={contactMessage}
                              onChange={(e) => setContactMessage(e.target.value)}
                              rows={4}
                              data-testid="textarea-contact-message"
                            />
                            <Button
                              onClick={handleContactGroup}
                              disabled={!contactMessage.trim()}
                              className="w-full"
                              data-testid="button-send-message"
                            >
                              Send Message
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {!isAccepted && (
                        <>
                          <Button
                            onClick={() => handleAcceptSelected(group.id)}
                            variant="default"
                            className="flex-1"
                            disabled={(selectedCustomers.get(group.id)?.size || 0) === 0}
                            data-testid={`button-accept-selected-${group.id}`}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept ({selectedCustomers.get(group.id)?.size || 0})
                          </Button>
                          <Button
                            onClick={() => handleAcceptGroup(group.id)}
                            variant="outline"
                            className="flex-1"
                            data-testid={`button-accept-all-${group.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            All
                          </Button>
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                /* Desktop: Collapsible inline */
                <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.id)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      data-testid={`button-toggle-${group.id}`}
                    >
                      {isExpanded ? 'Hide' : 'View'} {group.customerCount} Customers
                      <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedCustomers.get(group.id)?.size || 0} of {group.customerCount} selected
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectAllCustomers(group.id, group.customerCount)}
                          data-testid={`button-select-all-${group.id}`}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deselectAllCustomers(group.id)}
                          data-testid={`button-deselect-all-${group.id}`}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    {group.customers.map((customer, idx) => {
                      const isSelected = selectedCustomers.get(group.id)?.has(idx) || false;
                      return (
                        <Card 
                          key={idx} 
                          className={`border-l-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/30' 
                              : 'border-l-gray-300 dark:border-l-gray-700'
                          }`}
                          onClick={() => toggleCustomerSelection(group.id, idx)}
                          data-testid={`card-customer-${group.id}-${idx}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => toggleCustomerSelection(group.id, idx)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1"
                                data-testid={`checkbox-customer-${group.id}-${idx}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{customer.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {customer.address}
                                </div>
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  {customer.service}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Action buttons - desktop only (mobile has them in sheet footer) */}
              {!isMobile && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMinimizeGroup(group.id)}
                    className="px-3"
                    data-testid={`button-minimize-${group.id}`}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedGroup(group)}
                        data-testid={`button-contact-${group.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Contact Customers</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                          Send a message to all {selectedGroup?.customerCount} customers in this group
                        </p>
                        <Textarea
                          placeholder="Type your message here..."
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          rows={4}
                          data-testid="textarea-contact-message"
                        />
                        <Button
                          onClick={handleContactGroup}
                          disabled={!contactMessage.trim()}
                          className="w-full"
                          data-testid="button-send-message"
                        >
                          Send Message
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {!isAccepted && (
                    <>
                      <Button
                        onClick={() => handleAcceptSelected(group.id)}
                        variant="default"
                        size="sm"
                        className="flex-1"
                        disabled={(selectedCustomers.get(group.id)?.size || 0) === 0}
                        data-testid={`button-accept-selected-${group.id}`}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept ({selectedCustomers.get(group.id)?.size || 0})
                      </Button>
                      <Button
                        onClick={() => handleAcceptGroup(group.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        data-testid={`button-accept-all-${group.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        All
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );

        return GroupCard;
      })}
    </div>
  );
}
