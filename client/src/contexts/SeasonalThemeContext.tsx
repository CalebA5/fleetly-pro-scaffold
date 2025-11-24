import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Season,
  TimeMode,
  ThemeMode,
  SeasonalTheme,
  getCurrentSeason,
  getTimeBasedMode,
  getAutoSeasonalTheme,
  getSeasonalTheme,
  SEASONAL_THEMES
} from '@/lib/seasonalThemes';

interface SeasonalThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  currentSeason: Season;
  currentTimeMode: TimeMode;
  activeTheme: SeasonalTheme;
  previewSeason: Season | null;
  setPreviewSeason: (season: Season | null) => void;
}

const SeasonalThemeContext = createContext<SeasonalThemeContextType | undefined>(undefined);

interface SeasonalThemeProviderProps {
  children: ReactNode;
}

export function SeasonalThemeProvider({ children }: SeasonalThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto-seasonal');
  const [currentSeason, setCurrentSeason] = useState<Season>(getCurrentSeason());
  const [currentTimeMode, setCurrentTimeMode] = useState<TimeMode>(getTimeBasedMode());
  const [activeTheme, setActiveTheme] = useState<SeasonalTheme>(getAutoSeasonalTheme());
  const [previewSeason, setPreviewSeason] = useState<Season | null>(null);

  // Load saved theme mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('fleetly-theme-mode') as ThemeMode | null;
    if (savedMode) {
      setThemeModeState(savedMode);
    }
  }, []);

  // Update theme mode and save to localStorage
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('fleetly-theme-mode', mode);
  };

  // Check for season/time changes every minute
  useEffect(() => {
    const checkSeasonAndTime = () => {
      const newSeason = getCurrentSeason();
      const newTimeMode = getTimeBasedMode();

      if (newSeason !== currentSeason) {
        setCurrentSeason(newSeason);
      }

      if (newTimeMode !== currentTimeMode) {
        setCurrentTimeMode(newTimeMode);
      }
    };

    // Check immediately
    checkSeasonAndTime();

    // Check every minute for time changes
    const interval = setInterval(checkSeasonAndTime, 60000);

    return () => clearInterval(interval);
  }, [currentSeason, currentTimeMode]);

  // Update active theme based on theme mode
  useEffect(() => {
    let newTheme: SeasonalTheme;

    // If previewing a season, use that
    if (previewSeason) {
      newTheme = getSeasonalTheme(previewSeason, currentTimeMode);
    } else {
      switch (themeMode) {
        case 'auto-seasonal':
          // Use current season + time-based mode (changes both palette and light/dark)
          newTheme = getSeasonalTheme(currentSeason, currentTimeMode);
          break;
        case 'time-based':
          // Lock to Winter palette (default/neutral theme) and only switch light/dark by time
          // This preserves the professional black/white Uber-style aesthetic
          newTheme = getSeasonalTheme('winter', currentTimeMode);
          break;
        case 'light':
          // Always light, current season
          newTheme = getSeasonalTheme(currentSeason, 'light');
          break;
        case 'dark':
          // Always dark, current season
          newTheme = getSeasonalTheme(currentSeason, 'dark');
          break;
        default:
          newTheme = getAutoSeasonalTheme();
      }
    }

    setActiveTheme(newTheme);
  }, [themeMode, currentSeason, currentTimeMode, previewSeason]);

  // Apply theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const colors = activeTheme.colors;

    // Apply all color variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Keep the orange accent consistent across all seasons
    root.style.setProperty('--accent', '25 95% 53%');
    root.style.setProperty('--accent-foreground', '0 0% 100%');
    root.style.setProperty('--accent-hover', '25 95% 48%');

    // Apply dark class for compatibility with existing components
    if (activeTheme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Store current theme info as data attributes for debugging
    root.setAttribute('data-season', activeTheme.season);
    root.setAttribute('data-mode', activeTheme.mode);
  }, [activeTheme]);

  return (
    <SeasonalThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        currentSeason,
        currentTimeMode,
        activeTheme,
        previewSeason,
        setPreviewSeason
      }}
    >
      {children}
    </SeasonalThemeContext.Provider>
  );
}

export function useSeasonalTheme() {
  const context = useContext(SeasonalThemeContext);
  if (!context) {
    throw new Error('useSeasonalTheme must be used within SeasonalThemeProvider');
  }
  return context;
}
