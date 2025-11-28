import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/LocationContext";
import { useSeasonalTheme } from "@/contexts/SeasonalThemeContext";
import { type ThemeMode } from "@/lib/seasonalThemes";
import { useI18n, LANGUAGE_OPTIONS, type SupportedLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ArrowLeft, Bell, Globe, Eye,
  MapPin, Lock, ChevronRight, LogOut,
  Sun, Moon, Sparkles, Palette, Navigation, X,
  CreditCard, FileText, HelpCircle, Smartphone
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsItemProps {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  danger?: boolean;
  "data-testid"?: string;
}

function SettingsItem({ 
  icon, 
  iconBg = "bg-gray-100 dark:bg-gray-800", 
  title, 
  subtitle, 
  value,
  onClick,
  rightElement,
  showChevron = true,
  danger = false,
  "data-testid": testId
}: SettingsItemProps) {
  const content = (
    <div className="flex items-center gap-4 py-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-medium ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {value && <span className="text-[14px] text-gray-500 dark:text-gray-400">{value}</span>}
      {rightElement}
      {showChevron && onClick && (
        <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 shrink-0" />
      )}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 px-4 -mx-4 transition-colors" data-testid={testId}>
        {content}
      </button>
    );
  }
  return <div className="px-0" data-testid={testId}>{content}</div>;
}

function SettingsSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      {title && (
        <h2 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 mb-2">
          {title}
        </h2>
      )}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { location: userLocation, permissionStatus, formattedAddress, refreshLocation, clearLocation } = useUserLocation();
  const { themeMode, setThemeMode, activeTheme } = useSeasonalTheme();
  const { language, setLanguage, t } = useI18n();
  
  const [isLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    jobAlerts: true,
    promotions: false,
  });
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as SupportedLanguage);
    const langInfo = LANGUAGE_OPTIONS.find(l => l.code === lang);
    toast({
      title: t.settings.languageUpdated,
      description: `${t.settings.appLanguageSetTo} ${langInfo?.nativeName || lang}`,
    });
  };
  
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [showAppearanceSheet, setShowAppearanceSheet] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    showRating: true,
    showJobHistory: false,
    allowAnalytics: true,
  });
  
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const contextParam = urlParams.get('context');
  const isCustomerContext = contextParam === 'customer' || location.includes('/customer/');
  const isOperatorContext = !isCustomerContext && (location.includes('/operator') || contextParam === 'operator');

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Password change failed",
          description: data.error || "Could not change password. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setShowPasswordSheet(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast({
        title: "Password change failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const handleRefreshLocation = async () => {
    try {
      await refreshLocation();
      toast({
        title: "Location updated",
        description: "Your location has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Location error",
        description: "Could not get your location. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  const handleClearLocation = () => {
    clearLocation();
    toast({
      title: "Location cleared",
      description: "Your saved location has been removed.",
    });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const currentLanguage = LANGUAGE_OPTIONS.find(l => l.code === language);
  
  const themeLabels: Record<ThemeMode, string> = {
    'light': 'Light',
    'dark': 'Dark',
    'time-based': 'Auto',
    'auto-seasonal': 'Seasonal'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-lg">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                if (window.history.length > 2) {
                  window.history.back();
                } else {
                  window.location.href = "/";
                }
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              {t.settings.settings}
            </h1>
          </div>
          
          <SettingsSection>
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t.auth.signIn} to access all settings</p>
              <Button 
                onClick={() => setLocation("/signin")}
                className="bg-orange-500 hover:bg-orange-600"
                data-testid="button-sign-in"
              >
                {t.auth.signIn}
              </Button>
            </div>
          </SettingsSection>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-24 md:pb-0">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            {t.settings.settings}
          </h1>
        </div>
        
        {/* Profile Section */}
        <SettingsSection>
          <div className="flex items-center gap-4 py-4">
            <Avatar className="h-16 w-16 border-2 border-white dark:border-gray-800 shadow-sm">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-lg font-semibold">
                {getInitials(user.name || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {user.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 capitalize">
                {user.role}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
          </div>
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title={t.settings.appearance}>
          <SettingsItem
            icon={<Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            title={t.settings.appearance}
            value={themeLabels[themeMode]}
            onClick={() => setShowAppearanceSheet(true)}
            data-testid="button-appearance"
          />
          <SettingsItem
            icon={<Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            title={t.settings.language}
            value={currentLanguage?.nativeName}
            rightElement={
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-auto h-8 border-0 bg-transparent shadow-none gap-1 pr-1 text-gray-500" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            showChevron={false}
          />
          <SettingsItem
            icon={<Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
            iconBg="bg-orange-100 dark:bg-orange-900/30"
            title={t.settings.notifications}
            subtitle={notifications.push ? "On" : "Off"}
            onClick={() => setShowNotificationsSheet(true)}
            data-testid="button-notifications"
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection title={t.settings.privacy}>
          <SettingsItem
            icon={<Lock className="h-5 w-5 text-green-600 dark:text-green-400" />}
            iconBg="bg-green-100 dark:bg-green-900/30"
            title={t.settings.changePassword}
            onClick={() => setShowPasswordSheet(true)}
            data-testid="button-change-password"
          />
          <SettingsItem
            icon={<Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            iconBg="bg-indigo-100 dark:bg-indigo-900/30"
            title={t.settings.privacySettings}
            onClick={() => setShowPrivacySheet(true)}
            data-testid="button-privacy-settings"
          />
          <SettingsItem
            icon={<MapPin className="h-5 w-5 text-red-600 dark:text-red-400" />}
            iconBg="bg-red-100 dark:bg-red-900/30"
            title={t.settings.locationServices}
            subtitle={permissionStatus === 'granted' ? t.settings.locationGranted : t.settings.locationPermission}
            onClick={() => setShowLocationSheet(true)}
            data-testid="button-location-settings"
          />
        </SettingsSection>

        {/* Account */}
        <SettingsSection title="Account">
          <SettingsItem
            icon={<CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            title="Payment Methods"
            onClick={() => setLocation("/wallet")}
            data-testid="button-payment"
          />
          <SettingsItem
            icon={<FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
            iconBg="bg-cyan-100 dark:bg-cyan-900/30"
            title="Terms & Policies"
            onClick={() => setLocation("/legal")}
            data-testid="button-legal"
          />
          <SettingsItem
            icon={<HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            title="Help & Support"
            onClick={() => toast({ title: "Support", description: "Contact support@fleetly.app" })}
            data-testid="button-support"
          />
        </SettingsSection>

        {/* Sign Out */}
        <SettingsSection>
          <SettingsItem
            icon={<LogOut className="h-5 w-5 text-red-500" />}
            iconBg="bg-red-50 dark:bg-red-900/20"
            title={t.settings.signOut}
            onClick={signOut}
            showChevron={false}
            danger
            data-testid="button-sign-out"
          />
        </SettingsSection>
        
        {/* App Version */}
        <div className="text-center py-6">
          <p className="text-xs text-gray-400 dark:text-gray-600">Fleetly v1.0.0</p>
        </div>
      </div>
      
      {/* Appearance Sheet */}
      <Sheet open={showAppearanceSheet} onOpenChange={setShowAppearanceSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold">{t.settings.appearance}</SheetTitle>
            <SheetDescription>Choose how Fleetly looks to you</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3">
            {[
              { mode: 'light' as ThemeMode, icon: Sun, label: 'Light' },
              { mode: 'dark' as ThemeMode, icon: Moon, label: 'Dark' },
              { mode: 'time-based' as ThemeMode, icon: Sparkles, label: 'Auto' },
              { mode: 'auto-seasonal' as ThemeMode, icon: Palette, label: 'Seasonal' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  themeMode === mode 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                data-testid={`button-theme-${mode}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  themeMode === mode 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`text-sm font-medium ${
                  themeMode === mode ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Notifications Sheet */}
      <Sheet open={showNotificationsSheet} onOpenChange={setShowNotificationsSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold">{t.settings.notifications}</SheetTitle>
            <SheetDescription>Manage how you receive updates</SheetDescription>
          </SheetHeader>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.settings.pushNotifications}</p>
                  <p className="text-sm text-gray-500">Receive push notifications</p>
                </div>
              </div>
              <Switch 
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                data-testid="switch-push-notifications"
              />
            </div>
            <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.settings.emailNotifications}</p>
                  <p className="text-sm text-gray-500">Get updates via email</p>
                </div>
              </div>
              <Switch 
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                data-testid="switch-email-notifications"
              />
            </div>
            {!isCustomerContext && (
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.settings.jobAlerts}</p>
                    <p className="text-sm text-gray-500">Get notified about new jobs</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications.jobAlerts}
                  onCheckedChange={(checked) => setNotifications({...notifications, jobAlerts: checked})}
                  data-testid="switch-job-alerts"
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Password Sheet */}
      <Sheet open={showPasswordSheet} onOpenChange={setShowPasswordSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold">{t.settings.changePassword}</SheetTitle>
            <SheetDescription>Enter your current and new password</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium">{t.settings.currentPassword}</Label>
              <Input 
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                placeholder="Enter current password"
                className="h-12 rounded-xl"
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">{t.settings.newPassword}</Label>
              <Input 
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                placeholder="Enter new password"
                className="h-12 rounded-xl"
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">{t.settings.confirmPassword}</Label>
              <Input 
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
                className="h-12 rounded-xl"
                data-testid="input-confirm-password"
              />
            </div>
            <Button 
              onClick={handlePasswordChange} 
              disabled={isChangingPassword}
              className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 mt-4"
              data-testid="button-save-password"
            >
              {isChangingPassword ? "Updating..." : t.settings.changePassword}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Privacy Sheet */}
      <Sheet open={showPrivacySheet} onOpenChange={setShowPrivacySheet}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold">{t.settings.privacySettings}</SheetTitle>
            <SheetDescription>Control your privacy preferences</SheetDescription>
          </SheetHeader>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t.settings.profileVisible}</p>
                <p className="text-sm text-gray-500">Allow others to see your profile</p>
              </div>
              <Switch 
                checked={privacySettings.profileVisible}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, profileVisible: checked})}
                data-testid="switch-profile-visible"
              />
            </div>
            <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t.settings.showRating}</p>
                <p className="text-sm text-gray-500">Display your rating publicly</p>
              </div>
              <Switch 
                checked={privacySettings.showRating}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showRating: checked})}
                data-testid="switch-show-rating"
              />
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t.settings.allowAnalytics}</p>
                <p className="text-sm text-gray-500">Help us improve Fleetly</p>
              </div>
              <Switch 
                checked={privacySettings.allowAnalytics}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, allowAnalytics: checked})}
                data-testid="switch-analytics"
              />
            </div>
          </div>
          <Button 
            onClick={() => {
              setShowPrivacySheet(false);
              toast({ title: "Settings saved" });
            }} 
            className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 mt-4"
            data-testid="button-save-privacy"
          >
            {t.common.save}
          </Button>
        </SheetContent>
      </Sheet>
      
      {/* Location Sheet */}
      <Sheet open={showLocationSheet} onOpenChange={setShowLocationSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold">{t.settings.locationServices}</SheetTitle>
            <SheetDescription>Manage your location preferences</SheetDescription>
          </SheetHeader>
          
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                permissionStatus === 'granted' ? 'bg-green-500' : 
                permissionStatus === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {permissionStatus === 'granted' ? t.settings.locationGranted : 
                 permissionStatus === 'denied' ? t.settings.locationDenied : 
                 t.settings.locationPermission}
              </span>
            </div>
            {formattedAddress && (
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{formattedAddress}</p>
            )}
            {userLocation && (
              <p className="text-xs text-gray-400 dark:text-gray-500 pl-6 mt-1">
                {userLocation.coords.latitude.toFixed(4)}, {userLocation.coords.longitude.toFixed(4)}
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl"
              onClick={handleRefreshLocation}
              data-testid="button-refresh-location"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {t.settings.updateLocation}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={handleClearLocation}
              data-testid="button-clear-location"
            >
              <X className="h-4 w-4 mr-2" />
              {t.settings.clearLocation}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            {t.settings.shareLocation}
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
}
