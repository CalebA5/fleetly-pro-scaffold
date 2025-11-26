import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OperatorStatusToggleProps {
  isOnline: boolean;
  onToggle: (goOnline: boolean) => void;
  isPending?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "mobile" | "compact" | "inline";
  label?: string;
  className?: string;
}

// Core pill-shaped toggle switch component
// Designed to match the online/offline badge styling on operator cards
function PillToggle({
  isOnline,
  onToggle,
  isPending,
  size = "md",
  className,
}: Omit<OperatorStatusToggleProps, "variant" | "label">) {
  // Reduced vertical height to match badge proportions
  // Track shape matches the rounded-full pill of online/offline badges
  const sizeClasses = {
    sm: {
      track: "w-11 h-5",
      knob: "w-4 h-4",
      translate: "translate-x-[22px]",
    },
    md: {
      track: "w-14 h-6",
      knob: "w-5 h-5",
      translate: "translate-x-[30px]",
    },
    lg: {
      track: "w-16 h-7",
      knob: "w-6 h-6",
      translate: "translate-x-[34px]",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <button
      onClick={() => !isPending && onToggle(!isOnline)}
      disabled={isPending}
      className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500",
        sizes.track,
        isOnline
          ? "bg-teal-500 hover:bg-teal-600"
          : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500",
        isPending && "opacity-50 cursor-not-allowed",
        className
      )}
      data-testid="button-toggle-online"
      aria-label={isOnline ? "Go offline" : "Go online"}
      aria-checked={isOnline}
      role="switch"
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out",
          "flex items-center justify-center",
          sizes.knob,
          isOnline ? sizes.translate : "translate-x-0"
        )}
      >
        {isPending && <Loader2 className="w-3 h-3 text-gray-600 animate-spin" />}
      </span>
    </button>
  );
}

// Main component with variants
export function OperatorStatusToggle({
  isOnline,
  onToggle,
  isPending = false,
  size = "md",
  variant = "inline",
  label,
  className,
}: OperatorStatusToggleProps) {
  // Mobile variant: Sticky full-width bar for always-visible access
  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-md",
          "px-4 py-3",
          className
        )}
        data-testid="container-status-toggle-mobile"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            {label && <h2 className="text-base font-semibold text-black dark:text-white mb-0.5">{label}</h2>}
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {isOnline ? "You're receiving job requests" : "Toggle to start receiving jobs"}
            </p>
          </div>
          <PillToggle
            isOnline={isOnline}
            onToggle={onToggle}
            isPending={isPending}
            size="md"
          />
        </div>
      </div>
    );
  }

  // Compact variant: Minimal inline for tight spaces
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)} data-testid="container-status-toggle-compact">
        <PillToggle
          isOnline={isOnline}
          onToggle={onToggle}
          isPending={isPending}
          size="sm"
        />
        <span className="text-sm font-medium text-black dark:text-white">
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>
    );
  }

  // Inline variant: Simple toggle with optional label
  return (
    <div className={cn("flex items-center gap-3", className)} data-testid="container-status-toggle-inline">
      {label && (
        <div>
          <h3 className="text-base font-semibold text-black dark:text-white">{label}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {isOnline ? "You're receiving job requests" : "Toggle to start receiving jobs"}
          </p>
        </div>
      )}
      <PillToggle
        isOnline={isOnline}
        onToggle={onToggle}
        isPending={isPending}
        size={size}
      />
    </div>
  );
}
