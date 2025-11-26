import * as React from "react";
import { cn } from "@/lib/utils";

interface PillToggleOption {
  value: string;
  label: string;
}

interface PillToggleProps {
  options: PillToggleOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const PillToggle = React.forwardRef<HTMLDivElement, PillToggleProps>(
  ({ options, value, onValueChange, className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-7 text-xs px-2",
      md: "h-9 text-sm px-3",
      lg: "h-11 text-base px-4",
    };

    const containerSizeClasses = {
      sm: "p-0.5 rounded-full",
      md: "p-1 rounded-full",
      lg: "p-1.5 rounded-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center bg-gray-100 dark:bg-gray-800",
          "shadow-inner",
          containerSizeClasses[size],
          className
        )}
        style={{
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.05)"
        }}
        {...props}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onValueChange(option.value)}
              className={cn(
                "relative z-10 flex items-center justify-center font-medium rounded-full transition-all duration-200",
                sizeClasses[size],
                isSelected
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              style={isSelected ? {
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)"
              } : {}}
              data-testid={`pill-toggle-${option.value}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }
);

PillToggle.displayName = "PillToggle";

export { PillToggle };
export type { PillToggleOption, PillToggleProps };
