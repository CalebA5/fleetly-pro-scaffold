import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Wrench, Truck, Home, Hammer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export function ServiceSelector({
  selectedServices,
  onServicesChange,
  placeholder = "Select services...",
  className,
  disabled = false,
}: ServiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onServicesChange([]);
  };

  const getSelectedServiceNames = () => {
    return selectedServices
      .map(id => TIER_SERVICES.find(s => s.id === id)?.name)
      .filter(Boolean);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer",
          "bg-transparent border-0 focus:outline-none",
          "text-gray-500 dark:text-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        data-testid="button-service-selector"
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
              onClick={clearAll}
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

      {isOpen && (
        <div className="fixed md:absolute z-[100] md:z-50 top-auto md:top-full left-4 right-4 md:left-0 md:right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[70vh] md:max-h-[60vh] overflow-y-auto" style={{ bottom: 'auto' }}>
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
                onClick={() => setIsOpen(false)}
                className="w-full bg-black dark:bg-white text-white dark:text-black"
                data-testid="button-done-services"
              >
                Done ({selectedServices.length} selected)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
