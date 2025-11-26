import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowRight } from "lucide-react";

interface TierOnlineConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentTier: string;
  newTier: string;
}

const TIER_CONFIG: Record<string, { label: string; shortLabel: string; badge: string; color: string }> = {
  professional: { label: "Professional & Certified", shortLabel: "Pro", badge: "🏆", color: "text-amber-600" },
  equipped: { label: "Skilled & Equipped", shortLabel: "Equipped", badge: "🚛", color: "text-blue-600" },
  manual: { label: "Manual Operator", shortLabel: "Manual", badge: "⛏️", color: "text-green-600" },
};

export function TierOnlineConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  currentTier,
  newTier,
}: TierOnlineConfirmDialogProps) {
  const currentConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.manual;
  const newConfig = TIER_CONFIG[newTier] || TIER_CONFIG.manual;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 max-w-md w-[calc(100%-2rem)] mx-auto">
        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle className="text-lg font-semibold text-center">
            Switch Online Status?
          </AlertDialogTitle>
          
          <div className="flex items-center justify-center gap-3 py-4 px-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <span className="text-2xl">{currentConfig.badge}</span>
              <span className={`text-xs font-medium ${currentConfig.color} text-center truncate w-full`}>
                {currentConfig.shortLabel}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-green-500 text-white rounded-full">
                Online
              </span>
            </div>
            
            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <span className="text-2xl">{newConfig.badge}</span>
              <span className={`text-xs font-medium ${newConfig.color} text-center truncate w-full`}>
                {newConfig.shortLabel}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-teal-500 text-white rounded-full">
                Go Online
              </span>
            </div>
          </div>
          
          <AlertDialogDescription className="text-center text-sm text-gray-600 dark:text-gray-400">
            Going online as <span className="font-semibold text-gray-900 dark:text-white">{newConfig.label}</span> will 
            automatically take you offline on <span className="font-semibold text-gray-900 dark:text-white">{currentConfig.label}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel 
            className="flex-1 order-2 sm:order-1"
            data-testid="button-cancel-tier-switch"
          >
            Stay on {currentConfig.shortLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 order-1 sm:order-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
            data-testid="button-confirm-tier-switch"
          >
            Switch to {newConfig.shortLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
