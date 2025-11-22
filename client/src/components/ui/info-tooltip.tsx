import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";

interface InfoTooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  testId?: string;
  ariaLabel?: string;
}

export function InfoTooltip({ 
  content, 
  side = "top", 
  testId = "button-info",
  ariaLabel = "More information"
}: InfoTooltipProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    // Mobile: Use Popover (tap to open)
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            data-testid={testId}
            aria-label={ariaLabel}
          >
            <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 text-sm" side={side}>
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  // Desktop: Use Tooltip (hover)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            data-testid={testId}
            aria-label={ariaLabel}
          >
            <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
