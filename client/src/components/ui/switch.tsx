import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[14px] w-6 shrink-0 cursor-pointer items-center rounded-full transition-all duration-200 ease-in-out",
      "data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600",
      "hover:data-[state=unchecked]:bg-gray-400 dark:hover:data-[state=unchecked]:bg-gray-500",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[10px] w-[10px] rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ml-0.5",
        "data-[state=checked]:translate-x-[10px] data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
