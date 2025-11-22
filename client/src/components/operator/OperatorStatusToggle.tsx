import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

interface OperatorStatusToggleProps {
  isOnline: boolean;
  onToggle: (goOnline: boolean) => void;
  isPending?: boolean;
  activeTier?: string;
  variant?: "mobile" | "desktop" | "compact";
  className?: string;
}

export function OperatorStatusToggle({
  isOnline,
  onToggle,
  isPending = false,
  activeTier = "",
  variant = "desktop",
  className,
}: OperatorStatusToggleProps) {
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleToggle = (checked: boolean) => {
    onToggle(checked);
  };

  // Mobile variant: Large touch-friendly toggle, sticky positioned
  if (variant === "mobile" || (isMobile && variant !== "compact")) {
    return (
      <div
        className={cn(
          "bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg",
          "sticky top-0 z-40 px-4 py-3",
          className
        )}
        data-testid="container-status-toggle-mobile"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-3 h-3 rounded-full animate-pulse",
                  isOnline
                    ? "bg-green-500 dark:bg-green-400"
                    : "bg-gray-400 dark:bg-gray-600"
                )}
              />
              <span className="font-semibold text-base text-black dark:text-white">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <InfoTooltip
              content={
                isOnline
                  ? "You're online and receiving job requests. Toggle off to stop receiving new jobs."
                  : "You're offline. Toggle on to start receiving job requests and earning."
              }
              testId="button-info-status-toggle"
              ariaLabel="Online status information"
            />
          </div>

          <div className="flex items-center gap-3">
            {activeTier && (
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-xs border-orange-500 text-orange-600 dark:text-orange-400"
              >
                {activeTier}
              </Badge>
            )}
            <Switch
              checked={isOnline}
              onCheckedChange={handleToggle}
              disabled={isPending}
              className="data-[state=checked]:bg-green-500 scale-125"
              data-testid="switch-online-status"
            />
          </div>
        </div>
      </div>
    );
  }

  // Compact variant: Minimal inline toggle
  if (variant === "compact") {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        data-testid="container-status-toggle-compact"
      >
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isOnline
              ? "bg-green-500 dark:bg-green-400 animate-pulse"
              : "bg-gray-400 dark:bg-gray-600"
          )}
        />
        <Switch
          checked={isOnline}
          onCheckedChange={handleToggle}
          disabled={isPending}
          className="data-[state=checked]:bg-green-500"
          data-testid="switch-online-status"
        />
        <span className="text-sm font-medium text-black dark:text-white">
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>
    );
  }

  // Desktop variant: Full-featured with badge and info
  return (
    <div
      className={cn(
        "flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 shadow-sm",
        className
      )}
      data-testid="container-status-toggle-desktop"
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            isOnline
              ? "bg-green-500 dark:bg-green-400 animate-pulse"
              : "bg-gray-400 dark:bg-gray-600"
          )}
        />
        <span className="font-semibold text-black dark:text-white">
          {isOnline ? "Online" : "Offline"}
        </span>
        <InfoTooltip
          content={
            isOnline
              ? "You're online and receiving job requests. Toggle off to stop receiving new jobs."
              : "You're offline. Toggle on to start receiving job requests and earning."
          }
          testId="button-info-status-toggle"
          ariaLabel="Online status information"
        />
      </div>

      {activeTier && (
        <Badge
          variant="outline"
          className="border-orange-500 text-orange-600 dark:text-orange-400"
        >
          {activeTier}
        </Badge>
      )}

      <Switch
        checked={isOnline}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="data-[state=checked]:bg-green-500 ml-auto"
        data-testid="switch-online-status"
      />
    </div>
  );
}
