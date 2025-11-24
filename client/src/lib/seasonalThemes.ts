// Seasonal Theme Configuration for Fleetly
// Maintains brand orange (#F97316) across all seasons

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type TimeMode = 'light' | 'dark';
export type ThemeMode = 'auto-seasonal' | 'light' | 'dark' | 'time-based';

export interface SeasonalTheme {
  season: Season;
  mode: TimeMode;
  label: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

// Get current season based on month
export function getCurrentSeason(): Season {
  const month = new Date().getMonth(); // 0-11
  
  // Dec (11), Jan (0), Feb (1) = Winter
  if (month === 11 || month === 0 || month === 1) return 'winter';
  // Mar (2), Apr (3), May (4) = Spring
  if (month >= 2 && month <= 4) return 'spring';
  // Jun (5), Jul (6), Aug (7) = Summer
  if (month >= 5 && month <= 7) return 'summer';
  // Sep (8), Oct (9), Nov (10) = Autumn
  return 'autumn';
}

// Get time-based mode (light during day, dark at night)
export function getTimeBasedMode(): TimeMode {
  const hour = new Date().getHours();
  // Dark mode: 6 PM (18) to 6 AM (6)
  return (hour >= 18 || hour < 6) ? 'dark' : 'light';
}

// Seasonal Theme Definitions
// Each season has light and dark variants

export const SEASONAL_THEMES: Record<Season, { light: SeasonalTheme; dark: SeasonalTheme }> = {
  // ❄️ WINTER THEME - Deep navy, ice blue, crisp contrast (Snow plowing season!)
  winter: {
    light: {
      season: 'winter',
      mode: 'light',
      label: 'Winter Light',
      colors: {
        background: '200 80% 96%',         // Bright icy blue-white (more noticeable)
        foreground: '215 35% 12%',         // Deeper navy text for contrast
        card: '200 75% 98%',               // Bright white cards with subtle blue
        cardForeground: '215 35% 12%',
        primary: '210 95% 55%',            // Vivid winter blue (more saturated)
        primaryForeground: '0 0% 100%',
        secondary: '200 60% 90%',          // Noticeable ice blue
        secondaryForeground: '215 35% 12%',
        muted: '200 50% 94%',              // Softer ice tone
        mutedForeground: '215 25% 40%',
        border: '200 45% 82%',             // More visible blue borders
        input: '200 45% 85%',              // Distinct input fields
        ring: '210 95% 55%',               // Bright focus rings
      }
    },
    dark: {
      season: 'winter',
      mode: 'dark',
      label: 'Winter Dark',
      colors: {
        background: '215 40% 10%',         // Deep midnight blue (more blue tone)
        foreground: '200 80% 95%',         // Bright ice white (more noticeable)
        card: '215 35% 12%',               // Slightly lighter navy cards
        cardForeground: '200 80% 95%',
        primary: '205 100% 60%',           // Electric ice blue (very noticeable)
        primaryForeground: '215 40% 10%',
        secondary: '215 30% 18%',          // Cool dark blue-gray
        secondaryForeground: '200 80% 95%',
        muted: '215 25% 16%',              // Subtle blue-gray
        mutedForeground: '200 50% 75%',    // Light ice blue text
        border: '215 30% 22%',             // More visible dark borders
        input: '215 30% 20%',              // Distinct input fields
        ring: '205 100% 60%',              // Bright electric focus
      }
    }
  },

  // 🌸 SPRING THEME - Fresh greens, sky blue, bright and energetic
  spring: {
    light: {
      season: 'spring',
      mode: 'light',
      label: 'Spring Light',
      colors: {
        background: '120 20% 98%',         // Creamy white with green hint
        foreground: '140 30% 15%',         // Deep green-gray
        card: '120 20% 98%',
        cardForeground: '140 30% 15%',
        primary: '140 60% 40%',            // Fresh green
        primaryForeground: '0 0% 100%',
        secondary: '120 30% 94%',          // Light sage
        secondaryForeground: '140 30% 15%',
        muted: '120 20% 96%',
        mutedForeground: '140 15% 45%',
        border: '120 20% 88%',
        input: '120 20% 88%',
        ring: '140 60% 40%',
      }
    },
    dark: {
      season: 'spring',
      mode: 'dark',
      label: 'Spring Dark',
      colors: {
        background: '140 20% 10%',         // Deep green-gray
        foreground: '120 20% 98%',         // Light cream
        card: '140 20% 12%',
        cardForeground: '120 20% 98%',
        primary: '140 60% 45%',            // Bright green
        primaryForeground: '140 20% 10%',
        secondary: '140 15% 18%',
        secondaryForeground: '120 20% 98%',
        muted: '140 15% 18%',
        mutedForeground: '120 20% 70%',
        border: '140 15% 22%',
        input: '140 15% 22%',
        ring: '140 60% 45%',
      }
    }
  },

  // ☀️ SUMMER THEME - Turquoise, sand, warm and vibrant
  summer: {
    light: {
      season: 'summer',
      mode: 'light',
      label: 'Summer Light',
      colors: {
        background: '45 100% 98%',         // Warm white
        foreground: '180 30% 15%',         // Deep teal-gray
        card: '45 100% 98%',
        cardForeground: '180 30% 15%',
        primary: '174 62% 47%',            // Turquoise
        primaryForeground: '0 0% 100%',
        secondary: '45 60% 92%',           // Light sand
        secondaryForeground: '180 30% 15%',
        muted: '45 40% 95%',
        mutedForeground: '180 15% 45%',
        border: '45 30% 88%',
        input: '45 30% 88%',
        ring: '174 62% 47%',
      }
    },
    dark: {
      season: 'summer',
      mode: 'dark',
      label: 'Summer Dark',
      colors: {
        background: '180 30% 10%',         // Deep teal
        foreground: '45 100% 98%',         // Warm white
        card: '180 30% 12%',
        cardForeground: '45 100% 98%',
        primary: '174 62% 52%',            // Bright turquoise
        primaryForeground: '180 30% 10%',
        secondary: '180 20% 18%',
        secondaryForeground: '45 100% 98%',
        muted: '180 20% 18%',
        mutedForeground: '45 60% 75%',
        border: '180 20% 22%',
        input: '180 20% 22%',
        ring: '174 62% 52%',
      }
    }
  },

  // 🍁 AUTUMN THEME - Rust, camel, warm and cozy
  autumn: {
    light: {
      season: 'autumn',
      mode: 'light',
      label: 'Autumn Light',
      colors: {
        background: '30 40% 98%',          // Warm cream
        foreground: '25 30% 15%',          // Deep brown
        card: '30 40% 98%',
        cardForeground: '25 30% 15%',
        primary: '12 76% 54%',             // Rust red
        primaryForeground: '0 0% 100%',
        secondary: '30 40% 92%',           // Light camel
        secondaryForeground: '25 30% 15%',
        muted: '30 30% 95%',
        mutedForeground: '25 20% 45%',
        border: '30 25% 88%',
        input: '30 25% 88%',
        ring: '12 76% 54%',
      }
    },
    dark: {
      season: 'autumn',
      mode: 'dark',
      label: 'Autumn Dark',
      colors: {
        background: '25 30% 10%',          // Deep brown
        foreground: '30 40% 98%',          // Warm cream
        card: '25 30% 12%',
        cardForeground: '30 40% 98%',
        primary: '12 76% 58%',             // Bright rust
        primaryForeground: '25 30% 10%',
        secondary: '25 20% 18%',
        secondaryForeground: '30 40% 98%',
        muted: '25 20% 18%',
        mutedForeground: '30 30% 75%',
        border: '25 20% 22%',
        input: '25 20% 22%',
        ring: '12 76% 58%',
      }
    }
  }
};

// Helper to get theme by season and mode
export function getSeasonalTheme(season: Season, mode: TimeMode): SeasonalTheme {
  return SEASONAL_THEMES[season][mode];
}

// Helper to get current seasonal theme based on auto mode
export function getAutoSeasonalTheme(): SeasonalTheme {
  const season = getCurrentSeason();
  const mode = getTimeBasedMode();
  return getSeasonalTheme(season, mode);
}

// Theme mode labels for UI
export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  'auto-seasonal': '🍂 Auto (Seasonal + Time)',
  'light': '☀️ Light',
  'dark': '🌙 Dark',
  'time-based': '🌍 Auto (Time Only)'
};

// Season emoji for UI
export const SEASON_EMOJI: Record<Season, string> = {
  winter: '❄️',
  spring: '🌸',
  summer: '☀️',
  autumn: '🍁'
};
