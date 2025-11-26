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

const iconGradients: Record<string, { bg: string; iconColor: string; darkBg: string; darkIcon: string }> = {
  DollarSign: { 
    bg: "bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-100", 
    iconColor: "text-emerald-600",
    darkBg: "dark:from-emerald-950 dark:via-emerald-900 dark:to-green-900",
    darkIcon: "dark:text-emerald-400"
  },
  MapPin: { 
    bg: "bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100", 
    iconColor: "text-blue-600",
    darkBg: "dark:from-blue-950 dark:via-blue-900 dark:to-indigo-900",
    darkIcon: "dark:text-blue-400"
  },
  Briefcase: { 
    bg: "bg-gradient-to-br from-amber-50 via-orange-100 to-amber-100", 
    iconColor: "text-amber-600",
    darkBg: "dark:from-amber-950 dark:via-orange-900 dark:to-amber-900",
    darkIcon: "dark:text-amber-400"
  },
  Star: { 
    bg: "bg-gradient-to-br from-yellow-50 via-amber-100 to-yellow-100", 
    iconColor: "text-yellow-600",
    darkBg: "dark:from-yellow-950 dark:via-amber-900 dark:to-yellow-900",
    darkIcon: "dark:text-yellow-400"
  },
  Wrench: { 
    bg: "bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100", 
    iconColor: "text-slate-600",
    darkBg: "dark:from-slate-950 dark:via-gray-800 dark:to-slate-800",
    darkIcon: "dark:text-slate-400"
  },
  Users: { 
    bg: "bg-gradient-to-br from-violet-50 via-purple-100 to-violet-100", 
    iconColor: "text-violet-600",
    darkBg: "dark:from-violet-950 dark:via-purple-900 dark:to-violet-900",
    darkIcon: "dark:text-violet-400"
  },
  Truck: { 
    bg: "bg-gradient-to-br from-cyan-50 via-teal-100 to-cyan-100", 
    iconColor: "text-cyan-600",
    darkBg: "dark:from-cyan-950 dark:via-teal-900 dark:to-cyan-900",
    darkIcon: "dark:text-cyan-400"
  },
  Target: { 
    bg: "bg-gradient-to-br from-rose-50 via-pink-100 to-rose-100", 
    iconColor: "text-rose-600",
    darkBg: "dark:from-rose-950 dark:via-pink-900 dark:to-rose-900",
    darkIcon: "dark:text-rose-400"
  },
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
        <div className="flex gap-4 overflow-hidden py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[160px] h-[100px] rounded-2xl overflow-hidden">
              <Skeleton className="w-full h-full" />
            </div>
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
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105"
        onClick={() => scroll("left")}
        data-testid="metrics-scroll-left"
      >
        <ChevronLeft className="h-4 w-4" />
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
          const isClickable = !!metric.navigateTo || !!metric.linkToTab;
          const gradientStyle = iconGradients[metric.icon] || iconGradients.Briefcase;
          
          return (
            <Card
              key={metric.id}
              className={`min-w-[160px] max-w-[180px] p-4 cursor-pointer transition-all duration-300 
                bg-white dark:bg-gray-900/80 
                border border-gray-100 dark:border-gray-800 
                hover:border-gray-200 dark:hover:border-gray-700 
                hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20
                hover:-translate-y-0.5
                active:scale-[0.98] active:translate-y-0
                rounded-2xl overflow-hidden
                group/card`}
              onClick={() => handleMetricClick(metric)}
              data-testid={`metric-card-${metric.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`relative p-2.5 rounded-xl ${gradientStyle.bg} ${gradientStyle.darkBg} shadow-sm`}>
                  <IconComponent className={`h-5 w-5 ${gradientStyle.iconColor} ${gradientStyle.darkIcon}`} strokeWidth={2} />
                  <div className="absolute inset-0 rounded-xl bg-white/20 dark:bg-white/5" />
                </div>
                <div className="flex items-center gap-1.5">
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
                    <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {formatMetricValue(value, metric.format)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">
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
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105"
        onClick={() => scroll("right")}
        data-testid="metrics-scroll-right"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
