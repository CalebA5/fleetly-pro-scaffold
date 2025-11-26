import { useSeasonalTheme } from "@/contexts/SeasonalThemeContext";
import { PillToggle } from "@/components/ui/pill-toggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Moon, Palette, Sparkles } from "lucide-react";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "time-based", label: "Auto", icon: Sparkles },
  { value: "auto-seasonal", label: "Seasonal", icon: Palette },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { themeMode, setThemeMode, activeTheme } = useSeasonalTheme();

  return (
    <div className="flex items-center gap-3">
      {showLabel && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme
        </Label>
      )}
      <PillToggle
        options={THEME_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
        value={themeMode}
        onValueChange={(value) => setThemeMode(value as any)}
        size="sm"
      />
    </div>
  );
}

export function ThemeSwitchRow() {
  const { themeMode, setThemeMode, activeTheme } = useSeasonalTheme();

  const toggleDarkMode = () => {
    if (themeMode === 'dark') {
      setThemeMode('light');
    } else if (themeMode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode(activeTheme.mode === 'dark' ? 'light' : 'dark');
    }
  };

  const isDark = activeTheme.mode === 'dark';

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="h-5 w-5 text-gray-500" />
        ) : (
          <Sun className="h-5 w-5 text-amber-500" />
        )}
        <Label className="font-medium">Dark Mode</Label>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={toggleDarkMode}
        data-testid="toggle-dark-mode"
      />
    </div>
  );
}

export function CompactThemeCard() {
  const { themeMode, setThemeMode, activeTheme } = useSeasonalTheme();

  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-sm">Appearance</h4>
          <span className="text-xs text-muted-foreground capitalize">
            {activeTheme.mode} mode
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = themeMode === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => setThemeMode(option.value as any)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all ${
                  isSelected
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                data-testid={`theme-button-${option.value}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
