import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Wrench, Truck, Home, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TIER_SERVICES } from "@shared/tierCapabilities";

interface ServiceSelectorProps {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SERVICE_CATEGORIES = {
  micro: {
    label: "Quick Jobs",
    icon: Wrench,
    description: "Manual labor services",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  standard: {
    label: "Equipment Services",
    icon: Truck,
    description: "Vehicle & equipment based",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  professional: {
    label: "Professional",
    icon: Home,
    description: "Licensed & certified work",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
};

function ServiceList({
  selectedServices,
  onServicesChange,
  searchQuery,
}: {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  searchQuery: string;
}) {
  const groupedServices = TIER_SERVICES.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, typeof TIER_SERVICES>);

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      onServicesChange(selectedServices.filter(s => s !== serviceId));
    } else {
      onServicesChange([...selectedServices, serviceId]);
    }
  };

  const filteredGroupedServices = Object.entries(groupedServices).reduce((acc, [category, services]) => {
    const filtered = services.filter(service => 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof TIER_SERVICES>);

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      {(["micro", "standard", "professional"] as const).map((category) => {
        const categoryConfig = SERVICE_CATEGORIES[category];
        const services = filteredGroupedServices[category] || [];
        const CategoryIcon = categoryConfig.icon;

        if (services.length === 0) return null;

        return (
          <div key={category} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className={cn(
              "sticky top-0 px-4 py-3 flex items-center gap-2 z-10",
              categoryConfig.bgColor,
              "backdrop-blur-sm"
            )}>
              <CategoryIcon className={cn("w-4 h-4", categoryConfig.color)} />
              <span className={cn("font-semibold text-sm", categoryConfig.color)}>
                {categoryConfig.label}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({services.length})
              </span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {services.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-all",
                      isSelected
                        ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
                        : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                    )}
                    data-testid={`service-option-${service.id}`}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected
                        ? "bg-white dark:bg-black border-white dark:border-black"
                        : "border-gray-300 dark:border-gray-600"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-black dark:text-white" />}
                    </div>
                    <span className="truncate font-medium">{service.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {Object.keys(filteredGroupedServices).length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No services found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}

function TriggerContent({
  selectedServices,
  placeholder,
  disabled,
  onClear,
  isOpen,
}: {
  selectedServices: string[];
  placeholder: string;
  disabled: boolean;
  onClear: (e: React.MouseEvent) => void;
  isOpen: boolean;
}) {
  const getSelectedServiceNames = () => {
    return selectedServices
      .map(id => TIER_SERVICES.find(s => s.id === id)?.name)
      .filter(Boolean);
  };

  return (
    <div
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer",
        "bg-transparent border-0",
        "text-gray-500 dark:text-gray-400",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {selectedServices.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedServices.length <= 2 ? (
              getSelectedServiceNames().map((name, i) => (
                <Badge key={i} variant="secondary" className="text-xs bg-black/10 dark:bg-white/10">
                  {name}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="text-xs bg-black/10 dark:bg-white/10">
                {selectedServices.length} services selected
              </Badge>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
        {selectedServices.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            data-testid="button-clear-services"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
        <ChevronDown className={cn(
          "w-5 h-5 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </div>
    </div>
  );
}

export function ServiceSelector({
  selectedServices,
  onServicesChange,
  placeholder = "Select services...",
  className,
  disabled = false,
}: ServiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onServicesChange([]);
  };

  const handleDone = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  if (disabled) {
    return (
      <div ref={triggerRef} className={cn("relative", className)}>
        <TriggerContent
          selectedServices={selectedServices}
          placeholder={placeholder}
          disabled={true}
          onClear={clearAll}
          isOpen={false}
        />
      </div>
    );
  }

  return (
    <>
      <div 
        ref={triggerRef} 
        className={cn("relative", className)}
        onClick={handleOpen}
        data-testid="button-service-selector"
      >
        <TriggerContent
          selectedServices={selectedServices}
          placeholder={placeholder}
          disabled={disabled}
          onClear={clearAll}
          isOpen={isOpen}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setSearchQuery("");
      }}>
        <DialogContent className="max-w-lg w-[95vw] md:w-full h-[80vh] md:h-[70vh] max-h-[600px] p-0 flex flex-col gap-0 rounded-2xl overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <DialogTitle className="text-center text-lg font-semibold">Select Services</DialogTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 border-0"
                data-testid="input-search-services"
              />
            </div>
          </DialogHeader>
          
          <ServiceList
            selectedServices={selectedServices}
            onServicesChange={onServicesChange}
            searchQuery={searchQuery}
          />
          
          <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <Button 
              onClick={handleDone}
              className="w-full h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-base hover:bg-gray-800 dark:hover:bg-gray-100"
              data-testid="button-done-services"
            >
              {selectedServices.length > 0 ? `Done (${selectedServices.length} selected)` : 'Done'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
