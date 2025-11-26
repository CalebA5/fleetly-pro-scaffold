import { useState, useEffect, createContext, useContext } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TooltipStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  highlight?: boolean;
}

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startOnboarding: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  hasCompletedTour: (tourId: string) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

const OPERATOR_DASHBOARD_TOUR: TooltipStep[] = [
  {
    id: "welcome",
    target: "[data-testid='operator-dashboard']",
    title: "Welcome to Your Dashboard",
    content: "This is your command center. Switch between tiers, manage jobs, and track earnings all from here.",
    position: "bottom",
  },
  {
    id: "tier-switcher",
    target: "[data-testid='button-tier-switcher']",
    title: "Switch Tiers",
    content: "Tap here to switch between your operator tiers. Each tier has different capabilities and job types.",
    position: "bottom",
    highlight: true,
  },
  {
    id: "online-toggle",
    target: "[data-testid='online-toggle']",
    title: "Go Online",
    content: "Toggle this to start receiving job requests. You can only be online on one tier at a time.",
    position: "bottom",
    highlight: true,
  },
  {
    id: "jobs-tab",
    target: "[data-testid='tabs-section']",
    title: "Manage Your Work",
    content: "View nearby jobs, active requests, and your job history using these tabs.",
    position: "top",
  },
];

const CUSTOMER_TOUR: TooltipStep[] = [
  {
    id: "welcome",
    target: "[data-testid='hero-section']",
    title: "Welcome to Fleetly",
    content: "Find and book trusted operators for snow plowing, towing, hauling, and more.",
    position: "bottom",
  },
  {
    id: "search",
    target: "[data-testid='input-pickup']",
    title: "Enter Your Location",
    content: "Start by entering your pickup location to find nearby operators.",
    position: "bottom",
    highlight: true,
  },
  {
    id: "browse",
    target: "[data-testid='nav-browse']",
    title: "Browse Operators",
    content: "View all available operators on a map or list view.",
    position: "top",
  },
];

const WALLET_TOUR: TooltipStep[] = [
  {
    id: "balance",
    target: "[data-testid='text-balance']",
    title: "Your Balance",
    content: "This is your available balance ready for withdrawal.",
    position: "bottom",
  },
  {
    id: "withdraw",
    target: "[data-testid='button-withdraw']",
    title: "Withdraw Funds",
    content: "Withdrawals are processed every Friday. Tap to schedule your payout.",
    position: "top",
    highlight: true,
  },
  {
    id: "filter",
    target: "[data-testid='select-tier-filter']",
    title: "Filter by Tier",
    content: "Filter your earnings by tier to see how much you've made in each category.",
    position: "bottom",
  },
];

const TOURS: Record<string, TooltipStep[]> = {
  "operator-dashboard": OPERATOR_DASHBOARD_TOUR,
  "customer": CUSTOMER_TOUR,
  "wallet": WALLET_TOUR,
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTours, setCompletedTours] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("fleetly_completed_tours");
    if (stored) {
      try {
        setCompletedTours(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to parse completed tours:", e);
      }
    }
  }, []);

  const saveCompletedTours = (tours: Set<string>) => {
    localStorage.setItem("fleetly_completed_tours", JSON.stringify([...tours]));
    setCompletedTours(tours);
  };

  const startOnboarding = (tourId: string) => {
    if (!completedTours.has(tourId) && TOURS[tourId]) {
      setActiveTour(tourId);
      setCurrentStep(0);
    }
  };

  const nextStep = () => {
    if (activeTour) {
      const tour = TOURS[activeTour];
      if (currentStep < tour.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        completeOnboarding();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    if (activeTour) {
      const newCompleted = new Set(completedTours);
      newCompleted.add(activeTour);
      saveCompletedTours(newCompleted);
      setActiveTour(null);
      setCurrentStep(0);
    }
  };

  const completeOnboarding = () => {
    if (activeTour) {
      const newCompleted = new Set(completedTours);
      newCompleted.add(activeTour);
      saveCompletedTours(newCompleted);
      setActiveTour(null);
      setCurrentStep(0);
    }
  };

  const hasCompletedTour = (tourId: string) => completedTours.has(tourId);

  const currentTour = activeTour ? TOURS[activeTour] : null;
  const currentTooltip = currentTour ? currentTour[currentStep] : null;

  return (
    <OnboardingContext.Provider
      value={{
        isActive: !!activeTour,
        currentStep,
        totalSteps: currentTour?.length || 0,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        hasCompletedTour,
      }}
    >
      {children}
      
      {activeTour && currentTooltip && (
        <OnboardingOverlay
          step={currentTooltip}
          currentStep={currentStep}
          totalSteps={currentTour?.length || 0}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipOnboarding}
        />
      )}
    </OnboardingContext.Provider>
  );
}

interface OnboardingOverlayProps {
  step: TooltipStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function OnboardingOverlay({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: OnboardingOverlayProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });

      const tooltipWidth = 280;
      const tooltipHeight = 160;
      const padding = 12;

      let tooltipTop = 0;
      let tooltipLeft = 0;

      switch (step.position) {
        case "top":
          tooltipTop = rect.top + window.scrollY - tooltipHeight - padding;
          tooltipLeft = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case "bottom":
          tooltipTop = rect.bottom + window.scrollY + padding;
          tooltipLeft = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case "left":
          tooltipTop = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2);
          tooltipLeft = rect.left + window.scrollX - tooltipWidth - padding;
          break;
        case "right":
          tooltipTop = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2);
          tooltipLeft = rect.right + window.scrollX + padding;
          break;
        default:
          tooltipTop = rect.bottom + window.scrollY + padding;
          tooltipLeft = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
      }

      tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
      tooltipTop = Math.max(16, tooltipTop);

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft });

      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step]);

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300"
        onClick={onSkip}
      />

      {step.highlight && (
        <div
          className="fixed z-[9999] rounded-lg ring-4 ring-teal-500/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 pointer-events-none transition-all duration-300"
          style={{
            top: position.top - 4,
            left: position.left - 4,
            width: position.width + 8,
            height: position.height + 8,
          }}
        />
      )}

      <div
        className="fixed z-[10000] w-[280px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {step.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {step.content}
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    i === currentStep
                      ? "bg-teal-500"
                      : i < currentStep
                      ? "bg-teal-300"
                      : "bg-gray-200 dark:bg-gray-600"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrev}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNext}
                className="h-7 px-3 text-xs bg-teal-600 hover:bg-teal-700"
              >
                {isLastStep ? "Done" : "Next"}
                {!isLastStep && <ChevronRight className="w-3 h-3 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function OnboardingTrigger({ tourId }: { tourId: string }) {
  const { startOnboarding, hasCompletedTour } = useOnboarding();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!hasCompletedTour(tourId)) {
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [tourId, hasCompletedTour]);

  if (!showPrompt || hasCompletedTour(tourId)) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-[260px]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              New here?
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Take a quick tour to learn the basics
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrompt(false)}
            className="flex-1 h-8 text-xs"
          >
            Maybe later
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowPrompt(false);
              startOnboarding(tourId);
            }}
            className="flex-1 h-8 text-xs bg-teal-600 hover:bg-teal-700"
          >
            Start tour
          </Button>
        </div>
      </div>
    </div>
  );
}
