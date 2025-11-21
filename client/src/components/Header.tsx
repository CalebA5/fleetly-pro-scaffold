import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { TierSwitcher } from "@/components/TierSwitcher";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useAuth } from "@/contexts/AuthContext";
import { Truck, Sparkles, Bell } from "lucide-react";
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

  // Fetch severe weather alerts count for badge
  const { data: alerts = [] } = useQuery<Array<{ status: string }>>({
    queryKey: ['/api/weather/alerts/severe'],
    refetchInterval: 4 * 60 * 60 * 1000, // Refetch every 4 hours
  });

  const activeAlertsCount = alerts.filter(alert => alert.status === 'active').length;

  // Check if user is on an operator dashboard route
  const isOnOperatorDashboard = ['/operator', '/manual-operator', '/equipped-operator', '/business'].includes(location);

  const handleDriveAndEarnClick = () => {
    if (onDriveAndEarn) {
      onDriveAndEarn();
    } else {
      // Default behavior if no handler provided - always go to Drive & Earn page
      if (isAuthenticated) {
        setLocation("/operator/onboarding");
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
            {/* Notifications - Show on all devices */}
            <Link href="/notifications">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-700 dark:text-gray-300 relative" 
                data-testid="button-notifications"
              >
                <Bell className="w-4 h-4 md:mr-2" />
                {activeAlertsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {activeAlertsCount > 9 ? '9+' : activeAlertsCount}
                  </Badge>
                )}
                <span className="hidden md:inline">Alerts</span>
              </Button>
            </Link>

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

            {/* Seasonal Theme Selector */}
            <ThemeSelector />

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
