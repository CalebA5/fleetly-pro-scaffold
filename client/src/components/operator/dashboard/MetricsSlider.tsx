import { useRef } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, MapPin, Briefcase, CheckCircle, Star, 
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

const metricColors: Record<string, { accent: string; border: string; text: string }> = {
  dailyEarnings: { 
    accent: "bg-emerald-500", 
    border: "border-emerald-100 dark:border-emerald-900/50",
    text: "text-emerald-600 dark:text-emerald-400"
  },
  jobsNearby: { 
    accent: "bg-blue-500", 
    border: "border-blue-100 dark:border-blue-900/50",
    text: "text-blue-600 dark:text-blue-400"
  },
  completedToday: { 
    accent: "bg-purple-500", 
    border: "border-purple-100 dark:border-purple-900/50",
    text: "text-purple-600 dark:text-purple-400"
  },
  rating: { 
    accent: "bg-amber-500", 
    border: "border-amber-100 dark:border-amber-900/50",
    text: "text-amber-600 dark:text-amber-400"
  },
  equipmentStatus: { 
    accent: "bg-slate-500", 
    border: "border-slate-100 dark:border-slate-900/50",
    text: "text-slate-600 dark:text-slate-400"
  },
  activeOperators: { 
    accent: "bg-cyan-500", 
    border: "border-cyan-100 dark:border-cyan-900/50",
    text: "text-cyan-600 dark:text-cyan-400"
  },
  fleetCount: { 
    accent: "bg-orange-500", 
    border: "border-orange-100 dark:border-orange-900/50",
    text: "text-orange-600 dark:text-orange-400"
  },
  radiusLimit: { 
    accent: "bg-rose-500", 
    border: "border-rose-100 dark:border-rose-900/50",
    text: "text-rose-600 dark:text-rose-400"
  },
};

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
            <Skeleton key={i} className="min-w-[150px] h-[110px] rounded-2xl" />
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
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
        onClick={() => scroll("left")}
        data-testid="metrics-scroll-left"
      >
        <ChevronLeft className="h-5 w-5" />
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
          const colors = metricColors[metric.id] || metricColors.equipmentStatus;
          const isClickable = !!metric.navigateTo || !!metric.linkToTab;
          
          return (
            <Card
              key={metric.id}
              className={`min-w-[140px] max-w-[160px] p-3.5 cursor-pointer transition-all duration-200 bg-white dark:bg-gray-800/80 border ${colors.border} shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group/card`}
              onClick={() => handleMetricClick(metric)}
              data-testid={`metric-card-${metric.id}`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${colors.accent}`} />
              
              <div className="flex items-center justify-between mb-2.5 pl-2">
                <IconComponent className={`h-4 w-4 ${colors.text}`} />
                <div className="flex items-center gap-1">
                  {metricData?.trend && metricData.trend !== "neutral" && (
                    <span 
                      className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                        metricData.trend === "up" 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-red-600 dark:text-red-400"
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
              <div className="space-y-0.5 pl-2">
                <p className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {formatMetricValue(value, metric.format)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
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
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
        onClick={() => scroll("right")}
        data-testid="metrics-scroll-right"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
