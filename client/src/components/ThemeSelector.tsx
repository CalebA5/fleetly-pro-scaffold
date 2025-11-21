import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSeasonalTheme } from "@/contexts/SeasonalThemeContext";
import { THEME_MODE_LABELS, SEASON_EMOJI, Season, SEASONAL_THEMES } from "@/lib/seasonalThemes";
import { Palette, Check } from "lucide-react";

export function ThemeSelector() {
  const { themeMode, setThemeMode, currentSeason, activeTheme } = useSeasonalTheme();

  const currentSeasonEmoji = SEASON_EMOJI[currentSeason];
  const currentModeLabel = activeTheme.mode === 'dark' ? '🌙' : '☀️';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 text-sm font-medium"
          data-testid="button-theme-selector"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden md:inline">
            {currentSeasonEmoji} {currentModeLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Theme Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Auto Seasonal Mode */}
        <DropdownMenuItem
          onClick={() => setThemeMode('auto-seasonal')}
          className="cursor-pointer gap-2"
          data-testid="theme-option-auto-seasonal"
        >
          <span className="flex-1">{THEME_MODE_LABELS['auto-seasonal']}</span>
          {themeMode === 'auto-seasonal' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        {/* Time-Based Mode */}
        <DropdownMenuItem
          onClick={() => setThemeMode('time-based')}
          className="cursor-pointer gap-2"
          data-testid="theme-option-time-based"
        >
          <span className="flex-1">{THEME_MODE_LABELS['time-based']}</span>
          {themeMode === 'time-based' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Manual Light */}
        <DropdownMenuItem
          onClick={() => setThemeMode('light')}
          className="cursor-pointer gap-2"
          data-testid="theme-option-light"
        >
          <span className="flex-1">{THEME_MODE_LABELS['light']}</span>
          {themeMode === 'light' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        {/* Manual Dark */}
        <DropdownMenuItem
          onClick={() => setThemeMode('dark')}
          className="cursor-pointer gap-2"
          data-testid="theme-option-dark"
        >
          <span className="flex-1">{THEME_MODE_LABELS['dark']}</span>
          {themeMode === 'dark' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Current: {activeTheme.season.charAt(0).toUpperCase() + activeTheme.season.slice(1)} {activeTheme.mode === 'dark' ? 'Dark' : 'Light'}
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SeasonPreviewButton({ season }: { season: Season }) {
  const { setPreviewSeason } = useSeasonalTheme();
  const seasonLabel = season.charAt(0).toUpperCase() + season.slice(1);
  const seasonEmoji = SEASON_EMOJI[season];

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setPreviewSeason(season)}
      className="gap-2"
      data-testid={`button-preview-${season}`}
    >
      {seasonEmoji} {seasonLabel}
    </Button>
  );
}
