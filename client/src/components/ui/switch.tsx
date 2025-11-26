import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: "sm" | "md" | "lg";
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-5 w-9",
    md: "h-[26px] w-[46px]",
    lg: "h-8 w-14",
  };
  
  const thumbSizeClasses = {
    sm: "h-4 w-4 data-[state=checked]:translate-x-[16px] data-[state=unchecked]:translate-x-[2px]",
    md: "h-[22px] w-[22px] data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]",
    lg: "h-6 w-6 data-[state=checked]:translate-x-[26px] data-[state=unchecked]:translate-x-[4px]",
  };

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-all duration-300 ease-out",
        "data-[state=checked]:bg-teal-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600",
        "hover:data-[state=unchecked]:bg-gray-350 dark:hover:data-[state=unchecked]:bg-gray-550",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "shadow-inner",
        sizeClasses[size],
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-white",
          "shadow-[0_2px_4px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)]",
          "ring-0 transition-transform duration-300 ease-out",
          "data-[state=checked]:shadow-[0_2px_6px_rgba(20,184,166,0.4),0_1px_2px_rgba(0,0,0,0.1)]",
          thumbSizeClasses[size],
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
