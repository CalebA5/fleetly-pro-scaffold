import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  to?: string;
  fallbackPath?: string;
  label?: string;
  className?: string;
}

export function BackButton({ 
  to, 
  fallbackPath = "/", 
  label = "Back",
  className = ""
}: BackButtonProps) {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleBack}
      className={`gap-2 ${className}`}
      data-testid="button-back"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}
