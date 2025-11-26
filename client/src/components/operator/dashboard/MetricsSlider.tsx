import { useRef } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, MapPin, Briefcase, Star, 
  Wrench, Users, Truck, Target, ChevronLeft, ChevronRight,
  ArrowUpRight, TrendingUp, TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MetricConfig } from "@shared/tierCapabilities";
import type { OperatorTier } from "@shared/schema";

const iconMap: Record<string, any> = {
  DollarSign,
  MapPin,
  Briefcase,
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
  onTabChange?: (tabId: string) => void;
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
  onMetricClick,
  onTabChange
}: MetricsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

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

  const handleMetricClick = (metric: MetricConfig) => {
    if (metric.navigateTo) {
      setLocation(metric.navigateTo);
    } else if (metric.linkToTab) {
      onTabChange?.(metric.linkToTab);
    } else {
      onMetricClick?.(metric.id);
    }
  };

  if (isLoading) {
    return (
      <div className="relative px-2">
        <div className="flex gap-3 overflow-hidden py-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="min-w-[140px] h-[88px] rounded-xl" />
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
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200"
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
          const isClickable = !!metric.navigateTo || !!metric.linkToTab;
          
          return (
            <Card
              key={metric.id}
              className="min-w-[140px] max-w-[160px] p-4 cursor-pointer transition-all duration-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md active:scale-[0.98] group/card"
              onClick={() => handleMetricClick(metric)}
              data-testid={`metric-card-${metric.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <IconComponent className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </div>
                <div className="flex items-center gap-1.5">
                  {metricData?.trend && metricData.trend !== "neutral" && (
                    <span 
                      className={`flex items-center gap-0.5 text-xs font-medium ${
                        metricData.trend === "up" 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      {metricData.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {metricData.trendValue}
                    </span>
                  )}
                  {isClickable && (
                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {formatMetricValue(value, metric.format)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
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
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200"
        onClick={() => scroll("right")}
        data-testid="metrics-scroll-right"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
