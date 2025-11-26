import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Wrench, Truck, Home, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
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
  onDone,
}: {
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  onDone: () => void;
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

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {(["micro", "standard", "professional"] as const).map((category) => {
        const categoryConfig = SERVICE_CATEGORIES[category];
        const services = groupedServices[category] || [];
        const CategoryIcon = categoryConfig.icon;

        return (
          <div key={category} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className={cn(
              "sticky top-0 px-4 py-2 flex items-center gap-2",
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
            <div className="p-2 grid grid-cols-2 gap-1">
              {services.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all",
                      isSelected
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    )}
                    data-testid={`service-option-${service.id}`}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                      isSelected
                        ? "bg-white dark:bg-black border-white dark:border-black"
                        : "border-gray-300 dark:border-gray-600"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-black dark:text-white" />}
                    </div>
                    <span className="truncate">{service.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {selectedServices.length > 0 && (
        <div className="sticky bottom-0 p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <Button 
            onClick={onDone}
            className="w-full bg-black dark:bg-white text-white dark:text-black"
            data-testid="button-done-services"
          >
            Done ({selectedServices.length} selected)
          </Button>
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
                <Badge key={i} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="text-xs">
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
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            data-testid="button-clear-services"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
        <ChevronDown className={cn(
          "w-5 h-5 text-gray-400 transition-transform",
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
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onServicesChange([]);
  };

  const handleDone = () => {
    setIsOpen(false);
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

  if (isMobile) {
    return (
      <div ref={triggerRef} className={cn("relative", className)}>
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <div data-testid="button-service-selector">
              <TriggerContent
                selectedServices={selectedServices}
                placeholder={placeholder}
                disabled={disabled}
                onClear={clearAll}
                isOpen={isOpen}
              />
            </div>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-center">Select Services</h3>
            </div>
            <ServiceList
              selectedServices={selectedServices}
              onServicesChange={onServicesChange}
              onDone={handleDone}
            />
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div ref={triggerRef} className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div data-testid="button-service-selector">
            <TriggerContent
              selectedServices={selectedServices}
              placeholder={placeholder}
              disabled={disabled}
              onClear={clearAll}
              isOpen={isOpen}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] min-w-[320px] max-w-[500px] p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          style={{ zIndex: 99999 }}
        >
          <ServiceList
            selectedServices={selectedServices}
            onServicesChange={onServicesChange}
            onDone={handleDone}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
