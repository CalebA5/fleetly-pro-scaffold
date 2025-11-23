import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  to: string;
  label?: string;
}

export function BackButton({ to, label = "Back" }: BackButtonProps) {
  return (
    <Link to={to}>
      <Button variant="ghost" size="sm" data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {label}
      </Button>
    </Link>
  );
}
