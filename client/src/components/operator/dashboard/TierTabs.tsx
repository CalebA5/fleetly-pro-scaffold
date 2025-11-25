import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Briefcase, Wrench, Settings, Clock, Users, Lock 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TabConfig } from "@shared/tierCapabilities";
import type { OperatorTier } from "@shared/schema";

const iconMap: Record<string, any> = {
  Briefcase,
  Wrench,
  Settings,
  Clock,
  Users,
};

interface TierTabsProps {
  tier: OperatorTier;
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: Record<string, React.ReactNode>;
}

export function TierTabs({ 
  tier, 
  tabs, 
  activeTab, 
  onTabChange,
  children 
}: TierTabsProps) {
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={onTabChange}
      className="w-full"
      data-testid="tier-tabs"
    >
      <TabsList className="w-full justify-start gap-1 bg-transparent border-b border-border rounded-none h-auto p-0 overflow-x-auto scrollbar-hide">
        <TooltipProvider>
          {tabs.map((tab) => {
            const IconComponent = iconMap[tab.icon] || Briefcase;
            const isAvailable = tab.tiers.includes(tier);
            
            if (!isAvailable) {
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <TabsTrigger
                        value={tab.id}
                        disabled
                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground/50 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent cursor-not-allowed"
                        data-testid={`tab-${tab.id}-locked`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <Lock className="h-3 w-3 ml-1" />
                      </TabsTrigger>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upgrade to Professional tier to unlock this feature</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent transition-colors"
                data-testid={`tab-${tab.id}`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TooltipProvider>
      </TabsList>
      
      {tabs.filter(tab => tab.tiers.includes(tier)).map((tab) => (
        <TabsContent 
          key={tab.id}
          value={tab.id}
          className="mt-4 focus-visible:outline-none focus-visible:ring-0"
          data-testid={`tab-content-${tab.id}`}
        >
          {children[tab.id]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
