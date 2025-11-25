import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Menu, Wallet, CreditCard, HelpCircle, Settings, FileText, 
  LogOut, DollarSign, BarChart3, Lock, User, ChevronRight 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DrawerMenuItem } from "@shared/tierCapabilities";
import type { OperatorTier } from "@shared/schema";
import { TIER_CAPABILITIES } from "@shared/tierCapabilities";

const iconMap: Record<string, any> = {
  Wallet,
  CreditCard,
  HelpCircle,
  Settings,
  FileText,
  DollarSign,
  BarChart3,
  User,
};

interface DrawerNavProps {
  tier: OperatorTier;
  menuItems: DrawerMenuItem[];
  operator?: {
    name: string;
    email?: string;
    photo?: string;
    rating?: number;
  };
  onLogout: () => void;
  onProfileClick?: () => void;
}

export function DrawerNav({ 
  tier, 
  menuItems, 
  operator,
  onLogout,
  onProfileClick
}: DrawerNavProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const tierInfo = TIER_CAPABILITIES[tier];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10"
          data-testid="drawer-menu-trigger"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="p-6 pb-4 bg-gradient-to-br from-primary/10 to-background">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={operator?.photo} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {operator?.name?.charAt(0) || "O"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left text-lg truncate">
                {operator?.name || "Operator"}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {tierInfo.badge} {tierInfo.label}
                </Badge>
              </div>
              {operator?.rating && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <span className="text-yellow-500">★</span>
                  <span>{operator.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </SheetHeader>
        
        <div className="py-2">
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 h-auto font-medium hover:bg-primary/5"
            onClick={() => {
              onProfileClick?.();
              setOpen(false);
            }}
            data-testid="drawer-profile-link"
          >
            <User className="h-5 w-5 mr-3" />
            <span>Profile</span>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>
        
        <Separator />
        
        <nav className="py-2">
          <TooltipProvider>
            {menuItems.map((item) => {
              const IconComponent = iconMap[item.icon] || Settings;
              const isActive = location === item.path;
              const isAvailable = item.tiers.includes(tier);
              
              if (!isAvailable) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <div 
                        className="flex items-center gap-3 px-6 py-3 text-muted-foreground/50 cursor-not-allowed"
                        data-testid={`drawer-item-${item.id}-locked`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="flex-1">{item.label}</span>
                        <Lock className="h-4 w-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Available in Professional tier</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              
              if (item.isPlaceholder) {
                return (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 px-6 py-3 text-muted-foreground cursor-not-allowed"
                    data-testid={`drawer-item-${item.id}-placeholder`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  </div>
                );
              }
              
              return (
                <Link key={item.id} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start px-6 py-3 h-auto font-medium ${
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                    }`}
                    onClick={() => setOpen(false)}
                    data-testid={`drawer-item-${item.id}`}
                  >
                    <IconComponent className="h-5 w-5 mr-3" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </TooltipProvider>
        </nav>
        
        <Separator />
        
        <div className="py-2">
          <Button
            variant="ghost"
            className="w-full justify-start px-6 py-3 h-auto font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
            data-testid="drawer-logout"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
