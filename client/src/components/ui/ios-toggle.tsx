import { cn } from "@/lib/utils";

interface IOSToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function IOSToggle({
  checked,
  onCheckedChange,
  disabled = false,
  size = "sm",
  className,
}: IOSToggleProps) {
  const sizes = {
    sm: {
      track: "w-10 h-[22px]",
      knob: "w-[18px] h-[18px]",
      translate: "translate-x-[18px]",
    },
    md: {
      track: "w-12 h-[26px]",
      knob: "w-[22px] h-[22px]",
      translate: "translate-x-[22px]",
    },
  };

  const s = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
        s.track,
        checked
          ? "bg-teal-500"
          : "bg-gray-300 dark:bg-gray-600",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      data-testid="ios-toggle"
    >
      <span
        className={cn(
          "pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          s.knob,
          checked ? s.translate : "translate-x-0.5"
        )}
      />
    </button>
  );
}
