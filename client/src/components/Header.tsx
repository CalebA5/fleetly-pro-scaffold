import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { TierSwitcher } from "@/components/TierSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { Truck, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  onSignIn?: () => void;
  onSignUp?: () => void;
  onDriveAndEarn?: () => void;
}

export const Header = ({ onSignIn, onSignUp, onDriveAndEarn }: HeaderProps) => {
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is on an operator dashboard route
  const isOnOperatorDashboard = ['/operator', '/manual-operator', '/equipped-operator', '/business'].includes(location);

  const handleDriveAndEarnClick = () => {
    if (onDriveAndEarn) {
      onDriveAndEarn();
    } else {
      // Default behavior if no handler provided
      if (isAuthenticated) {
        if (user?.operatorProfileComplete) {
          // Route based on businessId first (business owners), then active tier
          if (user?.businessId) {
            // Business owner with multiple drivers
            setLocation("/business");
          } else {
            // Individual operator - route based on active tier
            const activeTier = user?.activeTier || user?.operatorTier;
            if (activeTier === 'manual') {
              setLocation("/manual-operator");
            } else if (activeTier === 'equipped') {
              setLocation("/equipped-operator");
            } else {
              // Professional individual operators go to /operator
              setLocation("/operator");
            }
          }
        } else {
          toast({
            title: "Complete Your Operator Profile",
            description: "Please fill out your profile and vehicle information to start earning.",
          });
          setLocation("/operator/onboarding");
        }
      } else {
        if (onSignUp) {
          onSignUp();
        }
      }
    }
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" data-testid="link-home-logo">
              <Truck className="w-8 h-8 text-black dark:text-white icon-warm-glow" />
              <span className="ml-2 text-2xl font-bold text-black dark:text-white">Fleetly</span>
            </div>
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            {/* AI Assist - Show on all devices */}
            <Link href="/customer/ai-assist">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300" 
                data-testid="link-ai-assist"
              >
                <Sparkles className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">AI Assist</span>
              </Button>
            </Link>

            {/* Browse Operators - Hide on small mobile */}
            <Link href="/customer/operator-map" className="hidden sm:inline">
              <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300" data-testid="link-browse-operators">
                Browse Operators
              </Button>
            </Link>

            {/* Drive & Earn - Hide on mobile, available via bottom nav */}
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleDriveAndEarnClick}
              className="hidden md:inline-flex text-gray-700 dark:text-gray-300"
              data-testid="button-earn"
            >
              Drive & Earn
            </Button>
            {!isAuthenticated ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onSignIn}
                  data-testid="button-sign-in"
                >
                  Sign in
                </Button>
                <Button 
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200" 
                  onClick={onSignUp}
                  data-testid="button-sign-up"
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                {user?.operatorId && isOnOperatorDashboard && <TierSwitcher />}
                <ProfileDropdown onDriveAndEarn={handleDriveAndEarnClick} />
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
