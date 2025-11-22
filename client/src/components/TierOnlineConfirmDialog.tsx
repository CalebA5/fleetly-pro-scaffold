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

interface TierOnlineConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentTier: string;
  newTier: string;
}

const TIER_LABELS: Record<string, string> = {
  professional: "Professional & Certified",
  equipped: "Skilled & Equipped",
  manual: "Manual",
};

export function TierOnlineConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  currentTier,
  newTier,
}: TierOnlineConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-gray-900">
        <AlertDialogHeader>
          <AlertDialogTitle>Switch Online Tier?</AlertDialogTitle>
          <AlertDialogDescription>
            You are currently online as <span className="font-semibold">{TIER_LABELS[currentTier]}</span>.
            <br /><br />
            Going online as <span className="font-semibold">{TIER_LABELS[newTier]}</span> will automatically take you offline on {TIER_LABELS[currentTier]}.
            <br /><br />
            Do you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-tier-switch">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
            data-testid="button-confirm-tier-switch"
          >
            Yes, Switch Tier
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
