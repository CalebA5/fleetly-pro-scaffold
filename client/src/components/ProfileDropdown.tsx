import { User, LogOut, HelpCircle, FileText, Truck, List, Palette, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useSeasonalTheme } from "@/contexts/SeasonalThemeContext";
import { THEME_MODE_LABELS, SEASON_EMOJI } from "@/lib/seasonalThemes";

interface ProfileDropdownProps {
  onDriveAndEarn?: () => void;
}

export const ProfileDropdown = ({ onDriveAndEarn }: ProfileDropdownProps) => {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full"
          data-testid="button-profile-menu"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <Link href="/customer/profile">
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
        <Link href="/help">
          <DropdownMenuItem data-testid="menu-help">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        
        {/* Theme Selector - Mobile Only */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger data-testid="menu-theme">
            <Palette className="mr-2 h-4 w-4" />
            <span>Theme {currentSeasonEmoji} {currentModeLabel}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Theme Settings
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setThemeMode('auto-seasonal')}
              className="cursor-pointer"
              data-testid="theme-option-auto-seasonal"
            >
              <span className="flex-1">{THEME_MODE_LABELS['auto-seasonal']}</span>
              {themeMode === 'auto-seasonal' && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setThemeMode('time-based')}
              className="cursor-pointer"
              data-testid="theme-option-time-based"
            >
              <span className="flex-1">{THEME_MODE_LABELS['time-based']}</span>
              {themeMode === 'time-based' && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setThemeMode('light')}
              className="cursor-pointer"
              data-testid="theme-option-light"
            >
              <span className="flex-1">{THEME_MODE_LABELS['light']}</span>
              {themeMode === 'light' && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setThemeMode('dark')}
              className="cursor-pointer"
              data-testid="theme-option-dark"
            >
              <span className="flex-1">{THEME_MODE_LABELS['dark']}</span>
              {themeMode === 'dark' && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} data-testid="menu-sign-out">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
