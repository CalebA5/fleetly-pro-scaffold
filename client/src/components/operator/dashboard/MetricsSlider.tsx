import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, MapPin, Briefcase, CheckCircle, Star, 
  Wrench, Users, Truck, Target, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MetricConfig } from "@shared/tierCapabilities";
import type { OperatorTier } from "@shared/schema";

const iconMap: Record<string, any> = {
  DollarSign,
  MapPin,
  Briefcase,
  CheckCircle,
  Star,
  Wrench,
  Users,
  Truck,
  Target,
};

interface MetricData {
  id: string;
  value: number | string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

interface MetricsSliderProps {
  tier: OperatorTier;
  metrics: MetricConfig[];
  data: MetricData[];
  isLoading?: boolean;
  onMetricClick?: (metricId: string) => void;
}

function formatMetricValue(value: number | string, format?: string): string {
  if (typeof value === "string") return value;
  
  switch (format) {
    case "currency":
      return `$${value.toFixed(2)}`;
    case "rating":
      return value.toFixed(1);
    case "distance":
      return `${value}km`;
    default:
      return value.toString();
  }
}

export function MetricsSlider({ 
  tier, 
  metrics, 
  data, 
  isLoading = false,
  onMetricClick 
}: MetricsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getMetricValue = (metricId: string): MetricData | undefined => {
    return data.find(d => d.id === metricId);
  };

  if (isLoading) {
    return (
      <div className="relative px-2">
        <div className="flex gap-3 overflow-hidden py-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="min-w-[140px] h-[90px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative group" data-testid="metrics-slider">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => scroll("left")}
        data-testid="metrics-scroll-left"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {metrics.map((metric) => {
          const IconComponent = iconMap[metric.icon] || Briefcase;
          const metricData = getMetricValue(metric.id);
          const value = metricData?.value ?? 0;
          
          return (
            <Card
              key={metric.id}
              className="min-w-[140px] p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-0 bg-gradient-to-br from-background to-muted/30 hover:scale-[1.02]"
              onClick={() => onMetricClick?.(metric.id)}
              data-testid={`metric-card-${metric.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                {metricData?.trend && (
                  <span 
                    className={`text-xs font-medium ${
                      metricData.trend === "up" ? "text-green-500" : 
                      metricData.trend === "down" ? "text-red-500" : 
                      "text-muted-foreground"
                    }`}
                  >
                    {metricData.trendValue || (metricData.trend === "up" ? "↑" : "↓")}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight">
                  {formatMetricValue(value, metric.format)}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {metric.label}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => scroll("right")}
        data-testid="metrics-scroll-right"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
