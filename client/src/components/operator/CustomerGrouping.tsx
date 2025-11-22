import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, MapPin, DollarSign, Clock, ChevronDown, MessageCircle, Phone, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
  onContactGroup?: (groupId: string, message: string) => void;
}

export function CustomerGrouping({ groups, onAcceptGroup, onContactGroup }: CustomerGroupingProps) {
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [acceptedGroupIds, setAcceptedGroupIds] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null);
  const [contactMessage, setContactMessage] = useState("");

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleAcceptGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setAcceptedGroupIds(prev => [...prev, groupId]);
    toast({
      title: "Group Accepted",
      description: `Accepted ${group.customerCount} jobs near ${group.location}`,
    });
    
    if (onAcceptGroup) {
      onAcceptGroup(groupId);
    }
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

  if (groups.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center">
            No customer groupings available yet
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Groups will appear when multiple customers in same area request services
          </p>
        </CardContent>
      </Card>
    );
  }

  // Mobile: Use Sheet (bottom drawer)
  // Desktop: Use inline expandable cards
  return (
    <div className="space-y-3">
      {groups.map((group) => {
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
                    <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(80vh-180px)]">
                      {group.customers.map((customer, idx) => (
                        <Card key={idx} className="border-l-4 border-l-orange-500">
                          <CardContent className="p-4">
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {customer.address}
                            </div>
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {customer.service}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
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
                        <Button
                          onClick={() => handleAcceptGroup(group.id)}
                          className="flex-1"
                          data-testid={`button-accept-all-${group.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept All
                        </Button>
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
                  <CollapsibleContent className="mt-3 space-y-2">
                    {group.customers.map((customer, idx) => (
                      <Card key={idx} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
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
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Action buttons - desktop only (mobile has them in sheet footer) */}
              {!isMobile && (
                <div className="flex gap-2 pt-2">
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
                    <Button
                      onClick={() => handleAcceptGroup(group.id)}
                      size="sm"
                      className="flex-1"
                      data-testid={`button-accept-all-${group.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept All
                    </Button>
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
