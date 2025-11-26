import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Bell, Moon, Globe, Shield, Eye, Volume2,
  MapPin, Smartphone, Lock, Mail, ChevronRight, LogOut
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
  const [isLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    jobAlerts: true,
    promotions: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
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
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Please sign in to access settings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-3 -ml-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences</p>
          </div>
        </div>

        {/* Appearance */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <CardTitle className="text-base font-semibold">Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500">Use dark theme</p>
                </div>
              </div>
              <Switch 
                checked={darkMode} 
                onCheckedChange={setDarkMode}
                data-testid="switch-dark-mode" 
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Language</p>
                  <p className="text-xs text-gray-500">Select your preferred language</p>
                </div>
              </div>
              <Select defaultValue="en">
                <SelectTrigger className="w-[120px] h-8" data-testid="select-language">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en" data-testid="option-english">English</SelectItem>
                  <SelectItem value="fr" data-testid="option-french">Français</SelectItem>
                  <SelectItem value="es" data-testid="option-spanish">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <CardTitle className="text-base font-semibold">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive push notifications</p>
                </div>
              </div>
              <Switch 
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                data-testid="switch-push-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive updates via email</p>
                </div>
              </div>
              <Switch 
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                data-testid="switch-email-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Job Alerts</p>
                  <p className="text-xs text-gray-500">Get notified about nearby jobs</p>
                </div>
              </div>
              <Switch 
                checked={notifications.jobAlerts}
                onCheckedChange={(checked) => setNotifications({...notifications, jobAlerts: checked})}
                data-testid="switch-job-alerts"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <CardTitle className="text-base font-semibold">Privacy & Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left" data-testid="button-change-password">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-xs text-gray-500">Update your account password</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left" data-testid="button-privacy-settings">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Privacy Settings</p>
                  <p className="text-xs text-gray-500">Control who can see your profile</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left" data-testid="button-location-settings">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Location Settings</p>
                  <p className="text-xs text-gray-500">Manage location permissions</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="pt-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={signOut}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
