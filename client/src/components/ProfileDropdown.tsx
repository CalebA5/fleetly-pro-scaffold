import { User, LogOut, HelpCircle, FileText, Truck, List, Palette, Settings, Wallet, CreditCard, Shield, LayoutDashboard, Home, Briefcase, Star, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSeasonalTheme } from "@/contexts/SeasonalThemeContext";
import { THEME_MODE_LABELS, SEASON_EMOJI } from "@/lib/seasonalThemes";

type DropdownContext = "home" | "operator-dashboard" | "customer";

interface ProfileDropdownProps {
  onDriveAndEarn?: () => void;
  context?: DropdownContext;
  operatorRating?: number;
  operatorTier?: string;
  operatorPhoto?: string;
  operatorServicesCount?: number;
  isOnline?: boolean;
}

export const ProfileDropdown = ({ 
  onDriveAndEarn,
  context = "home",
  operatorRating,
  operatorTier,
  operatorPhoto,
  operatorServicesCount,
  isOnline
}: ProfileDropdownProps) => {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const { themeMode, setThemeMode, currentSeason, activeTheme } = useSeasonalTheme();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  const currentSeasonEmoji = SEASON_EMOJI[currentSeason];
  const currentModeLabel = activeTheme.mode === 'dark' ? '🌙' : '☀️';

  const isOnOperatorDashboard = context === "operator-dashboard" || location.startsWith("/operator");

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case "professional": return "🏆";
      case "equipped": return "🚛";
      case "manual": return "⛏️";
      default: return null;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full"
          data-testid="button-profile-menu"
        >
          <Avatar className="h-10 w-10">
            {operatorPhoto ? (
              <AvatarImage src={operatorPhoto} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 p-3">
          <Avatar className="h-12 w-12">
            {operatorPhoto ? (
              <AvatarImage src={operatorPhoto} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-none truncate">{user.name}</p>
              {isOnOperatorDashboard && getTierBadge(operatorTier) && (
                <span className="text-sm">{getTierBadge(operatorTier)}</span>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
            {isOnOperatorDashboard && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {operatorRating !== undefined && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">{operatorRating.toFixed(1)}</span>
                  </span>
                )}
                {operatorServicesCount !== undefined && operatorServicesCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    • {operatorServicesCount} service{operatorServicesCount !== 1 ? 's' : ''}
                  </span>
                )}
                {isOnline !== undefined && (
                  <span className={`inline-flex items-center gap-1 text-xs ${isOnline ? 'text-teal-600' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-500 animate-pulse' : 'bg-gray-400'}`} />
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        
        {isOnOperatorDashboard ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                Operator
              </DropdownMenuLabel>
              <Link href="/operator">
                <DropdownMenuItem data-testid="menu-dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/operator/earnings">
                <DropdownMenuItem data-testid="menu-earnings">
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Earnings</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/operator/nearby-jobs">
                <DropdownMenuItem data-testid="menu-nearby-jobs">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Nearby Jobs</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                Account
              </DropdownMenuLabel>
              <Link href="/profile?from=/operator">
                <DropdownMenuItem data-testid="menu-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
              </Link>
              {user.operatorId && (
                <Link href={`/customer/operator-profile/${user.operatorId}`}>
                  <DropdownMenuItem data-testid="menu-view-public-profile">
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>View Public Profile</span>
                  </DropdownMenuItem>
                </Link>
              )}
              <Link href="/settings">
                <DropdownMenuItem data-testid="menu-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/wallet">
                <DropdownMenuItem data-testid="menu-wallet">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Wallet & Payments</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                Support
              </DropdownMenuLabel>
              <Link href="/help">
                <DropdownMenuItem data-testid="menu-help-support">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/legal">
                <DropdownMenuItem data-testid="menu-legal">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Legal & Policies</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Link href="/">
              <DropdownMenuItem data-testid="menu-home">
                <Home className="mr-2 h-4 w-4" />
                <span>Back to Home</span>
              </DropdownMenuItem>
            </Link>
          </>
        ) : (
          <>
            <DropdownMenuGroup>
              <Link href="/profile?from=/">
                <DropdownMenuItem data-testid="menu-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/customer/requests">
                <DropdownMenuItem data-testid="menu-my-requests">
                  <List className="mr-2 h-4 w-4" />
                  <span>My Requests</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={onDriveAndEarn}
                data-testid="menu-drive-earn"
              >
                <Truck className="mr-2 h-4 w-4" />
                <span>Drive & Earn</span>
              </DropdownMenuItem>
              <Link href="/customer/operator-map">
                <DropdownMenuItem data-testid="menu-request-services">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Request Services</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                Account
              </DropdownMenuLabel>
              <Link href="/settings?context=customer">
                <DropdownMenuItem data-testid="menu-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/wallet">
                <DropdownMenuItem data-testid="menu-wallet">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Wallet</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Link href="/help">
              <DropdownMenuItem data-testid="menu-help">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/legal">
              <DropdownMenuItem data-testid="menu-legal">
                <FileText className="mr-2 h-4 w-4" />
                <span>Legal & Policies</span>
              </DropdownMenuItem>
            </Link>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Palette className="h-3.5 w-3.5" />
            Theme
          </span>
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setThemeMode('auto-seasonal')}
              className={`p-1.5 rounded-md text-sm transition-colors ${
                themeMode === 'auto-seasonal'
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              }`}
              title="Auto (Seasonal)"
              data-testid="theme-option-auto-seasonal"
            >
              🍂
            </button>
            <button
              onClick={() => setThemeMode('time-based')}
              className={`p-1.5 rounded-md text-sm transition-colors ${
                themeMode === 'time-based'
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              }`}
              title="Time-based"
              data-testid="theme-option-time-based"
            >
              🌍
            </button>
            <button
              onClick={() => setThemeMode('light')}
              className={`p-1.5 rounded-md text-sm transition-colors ${
                themeMode === 'light'
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              }`}
              title="Light"
              data-testid="theme-option-light"
            >
              ☀️
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`p-1.5 rounded-md text-sm transition-colors ${
                themeMode === 'dark'
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-background/50'
              }`}
              title="Dark"
              data-testid="theme-option-dark"
            >
              🌙
            </button>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20" data-testid="menu-sign-out">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
