import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/LocationContext";
import { useI18n, LANGUAGE_OPTIONS, type SupportedLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompactThemeCard } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Bell, Moon, Globe, Shield, Eye, Volume2,
  MapPin, Smartphone, Lock, Mail, ChevronRight, LogOut, Palette, X, Check, Navigation
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const { location: userLocation, permissionStatus, formattedAddress, refreshLocation, clearLocation } = useUserLocation();
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
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  
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
      setShowPasswordDialog(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-2xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full"
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
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {t.settings.settings}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.settings.appearance}</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">{t.auth.signIn}</p>
              <div className="flex justify-center mt-4">
                <Button 
                  onClick={() => window.location.href = "/signin"}
                  data-testid="button-sign-in"
                >
                  {t.auth.signIn}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              {t.settings.settings}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.settings.appearance}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Appearance */}
          <CompactThemeCard />
          
          {/* Language */}
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.settings.language}</p>
                    <p className="text-xs text-gray-500">{t.settings.selectLanguage}</p>
                  </div>
                </div>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[140px] h-9 border-gray-200 dark:border-gray-700" data-testid="select-language">
                    <SelectValue placeholder={t.settings.language} />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-base font-semibold">{t.settings.notifications}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.settings.pushNotifications}</span>
                </div>
                <Switch 
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                  data-testid="switch-push-notifications"
                />
              </div>
              <Separator className="bg-gray-100 dark:bg-gray-700" />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.settings.emailNotifications}</span>
                </div>
                <Switch 
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  data-testid="switch-email-notifications"
                />
              </div>
              {/* Only show job alerts for operators */}
              {!isCustomerContext && (
                <>
                  <Separator className="bg-gray-100 dark:bg-gray-700" />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t.settings.jobAlerts}</span>
                    </div>
                    <Switch 
                      checked={notifications.jobAlerts}
                      onCheckedChange={(checked) => setNotifications({...notifications, jobAlerts: checked})}
                      data-testid="switch-job-alerts"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-base font-semibold">{t.settings.privacy}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">
              <button 
                onClick={() => setShowPasswordDialog(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left" 
                data-testid="button-change-password"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.settings.changePassword}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button 
                onClick={() => setShowPrivacyDialog(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left" 
                data-testid="button-privacy-settings"
              >
                <div className="flex items-center gap-3">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.settings.privacySettings}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button 
                onClick={() => setShowLocationDialog(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left" 
                data-testid="button-location-settings"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t.settings.locationServices}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={signOut}
                data-testid="button-sign-out"
              >
                <LogOut className="mr-3 h-4 w-4" />
                {t.settings.signOut}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t.settings.changePassword}
            </DialogTitle>
            <DialogDescription>
              {t.settings.currentPassword}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t.settings.currentPassword}</Label>
              <Input 
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                placeholder={t.settings.currentPassword}
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t.settings.newPassword}</Label>
              <Input 
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                placeholder={t.settings.newPassword}
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t.settings.confirmPassword}</Label>
              <Input 
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                placeholder={t.settings.confirmPassword}
                data-testid="input-confirm-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handlePasswordChange} data-testid="button-save-password">
              {t.settings.changePassword}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Privacy Settings Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t.settings.privacySettings}
            </DialogTitle>
            <DialogDescription>
              {t.settings.privacy}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.settings.profileVisible}</p>
                <p className="text-xs text-gray-500">{t.settings.privacy}</p>
              </div>
              <Switch 
                checked={privacySettings.profileVisible}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, profileVisible: checked})}
                data-testid="switch-profile-visible"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.settings.showRating}</p>
                <p className="text-xs text-gray-500">{t.settings.privacy}</p>
              </div>
              <Switch 
                checked={privacySettings.showRating}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showRating: checked})}
                data-testid="switch-show-rating"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.settings.allowAnalytics}</p>
                <p className="text-xs text-gray-500">{t.settings.privacy}</p>
              </div>
              <Switch 
                checked={privacySettings.allowAnalytics}
                onCheckedChange={(checked) => setPrivacySettings({...privacySettings, allowAnalytics: checked})}
                data-testid="switch-analytics"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowPrivacyDialog(false);
              toast({ title: t.common.success });
            }} data-testid="button-save-privacy">
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Location Settings Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t.settings.locationServices}
            </DialogTitle>
            <DialogDescription>
              {t.settings.locationPermission}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${permissionStatus === 'granted' ? 'bg-green-500' : permissionStatus === 'denied' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium">
                  {permissionStatus === 'granted' ? t.settings.locationGranted : 
                   permissionStatus === 'denied' ? t.settings.locationDenied : 
                   t.settings.locationPermission}
                </span>
              </div>
              {formattedAddress && (
                <p className="text-xs text-gray-500 mt-2 pl-6">{formattedAddress}</p>
              )}
              {userLocation && (
                <p className="text-xs text-gray-400 pl-6">
                  Lat: {userLocation.coords.latitude.toFixed(4)}, Lon: {userLocation.coords.longitude.toFixed(4)}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleRefreshLocation}
                data-testid="button-refresh-location"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {t.settings.updateLocation}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 text-red-600 hover:text-red-700"
                onClick={handleClearLocation}
                data-testid="button-clear-location"
              >
                <X className="h-4 w-4 mr-2" />
                {t.settings.clearLocation}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              {t.settings.shareLocation}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLocationDialog(false)}>
              {t.common.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
