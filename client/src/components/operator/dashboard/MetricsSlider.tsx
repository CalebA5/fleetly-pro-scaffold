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

const metricColors: Record<string, { bg: string; icon: string; gradient: string }> = {
  dailyEarnings: { 
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20", 
    icon: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20"
  },
  jobsNearby: { 
    bg: "bg-blue-500/10 dark:bg-blue-500/20", 
    icon: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20"
  },
  completedToday: { 
    bg: "bg-purple-500/10 dark:bg-purple-500/20", 
    icon: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20"
  },
  rating: { 
    bg: "bg-amber-500/10 dark:bg-amber-500/20", 
    icon: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20"
  },
  equipmentStatus: { 
    bg: "bg-slate-500/10 dark:bg-slate-500/20", 
    icon: "text-slate-600 dark:text-slate-400",
    gradient: "from-slate-50 to-slate-100/50 dark:from-slate-950/30 dark:to-slate-900/20"
  },
  activeOperators: { 
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20", 
    icon: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20"
  },
  fleetCount: { 
    bg: "bg-orange-500/10 dark:bg-orange-500/20", 
    icon: "text-orange-600 dark:text-orange-400",
    gradient: "from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20"
  },
  radiusLimit: { 
    bg: "bg-rose-500/10 dark:bg-rose-500/20", 
    icon: "text-rose-600 dark:text-rose-400",
    gradient: "from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20"
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
        className="flex gap-4 overflow-x-auto scrollbar-hide py-3 px-1 scroll-smooth"
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
              className={`min-w-[150px] p-4 cursor-pointer transition-all duration-300 border-0 shadow-sm hover:shadow-xl bg-gradient-to-br ${colors.gradient} hover:scale-[1.03] active:scale-[0.98] relative overflow-hidden group/card`}
              onClick={() => handleMetricClick(metric)}
              data-testid={`metric-card-${metric.id}`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-x-6 -translate-y-6" />
              
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${colors.bg} transition-transform duration-300 group-hover/card:scale-110`}>
                  <IconComponent className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div className="flex items-center gap-1">
                  {metricData?.trend && metricData.trend !== "neutral" && (
                    <span 
                      className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        metricData.trend === "up" 
                          ? "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/50" 
                          : "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/50"
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
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {formatMetricValue(value, metric.format)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
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
