import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/enhanced-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { FaYahoo } from "react-icons/fa";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
  signupRole?: "customer" | "operator";
  onAuthSuccess?: () => void;
  prefillName?: string;
}

export const AuthDialog = ({ 
  open, 
  onOpenChange, 
  defaultTab = "signin",
  signupRole = "customer",
  onAuthSuccess,
  prefillName = ""
}: AuthDialogProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [, setLocation] = useLocation();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  
  // Sync activeTab with defaultTab when dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);
  
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signupName, setSignupName] = useState(prefillName);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  
  // Password visibility toggles
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  // Validation states
  const [emailValidation, setEmailValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });
  
  const [nameValidation, setNameValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });
  
  const [passwordValidation, setPasswordValidation] = useState<{
    status: 'idle' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });
  
  // Update signup name when prefillName changes
  useEffect(() => {
    if (prefillName) {
      setSignupName(prefillName);
    }
  }, [prefillName]);
  
  // Password validation: min 8 chars, at least one letter and one number
  useEffect(() => {
    if (!signupPassword) {
      setPasswordValidation({ status: 'idle' });
      return;
    }
    
    const hasMinLength = signupPassword.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(signupPassword);
    const hasNumber = /[0-9]/.test(signupPassword);
    
    if (!hasMinLength) {
      setPasswordValidation({ 
        status: 'invalid', 
        message: 'Password must be at least 8 characters' 
      });
    } else if (!hasLetter || !hasNumber) {
      setPasswordValidation({ 
        status: 'invalid', 
        message: 'Password must contain both letters and numbers' 
      });
    } else {
      setPasswordValidation({ 
        status: 'valid', 
        message: 'Password is strong' 
      });
    }
  }, [signupPassword]);
  
  // Debounced email verification
  useEffect(() => {
    if (!signupEmail || signupEmail.length < 3) {
      setEmailValidation({ status: 'idle' });
      return;
    }
    
    const timer = setTimeout(async () => {
      setEmailValidation({ status: 'checking' });
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: signupEmail }),
        });
        
        const data = await response.json();
        
        if (data.isAvailable) {
          setEmailValidation({ status: 'valid', message: 'Email is available' });
        } else {
          setEmailValidation({ status: 'invalid', message: data.message });
        }
      } catch (error) {
        setEmailValidation({ status: 'idle' });
      }
    }, 800); // 800ms debounce
    
    return () => clearTimeout(timer);
  }, [signupEmail]);
  
  // Debounced name verification
  useEffect(() => {
    if (!signupName || signupName.length < 2) {
      setNameValidation({ status: 'idle' });
      return;
    }
    
    const timer = setTimeout(async () => {
      setNameValidation({ status: 'checking' });
      try {
        const response = await fetch('/api/auth/verify-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: signupName, email: signupEmail }),
        });
        
        const data = await response.json();
        
        if (data.isAvailable) {
          setNameValidation({ status: 'valid', message: 'Name is available' });
        } else {
          setNameValidation({ status: 'invalid', message: data.message });
        }
      } catch (error) {
        setNameValidation({ status: 'idle' });
      }
    }, 800); // 800ms debounce
    
    return () => clearTimeout(timer);
  }, [signupName, signupEmail]);

  const handleSignIn = async () => {
    try {
      await signIn(signinEmail.toLowerCase().trim(), signinPassword);
      toast({
        title: t.auth.signInSuccess,
        description: t.home.welcome,
      });
      onOpenChange(false);
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      toast({
        title: t.common.error,
        description: t.auth.invalidCredentials,
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async () => {
    if (emailValidation.status === 'invalid' || nameValidation.status === 'invalid' || passwordValidation.status === 'invalid') {
      toast({
        title: t.common.error,
        description: t.auth.passwordsDoNotMatch,
        variant: "destructive",
      });
      return;
    }
    
    try {
      await signUp(signupName, signupEmail.toLowerCase().trim(), signupPassword, signupRole);
      toast({
        title: t.auth.signUpSuccess,
        description: t.home.welcome,
      });
      onOpenChange(false);
      
      if (onAuthSuccess) {
        onAuthSuccess();
      } else if (signupRole === "operator") {
        setLocation("/drive-earn");
      }
    } catch (error: any) {
      const errorMessage = error?.message || t.common.error;
      const errorDetails = error?.details;
      
      let description = errorMessage;
      if (errorDetails) {
        description = errorDetails.email || errorDetails.name || errorMessage;
      }
      
      toast({
        title: t.common.error,
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t.home.welcome}</DialogTitle>
          <DialogDescription>
            {t.home.tagline}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" data-testid="tab-signin">{t.auth.signIn}</TabsTrigger>
            <TabsTrigger value="signup" data-testid="tab-signup">{t.auth.signUp}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => window.location.href = `/api/auth/oauth/google?role=${signupRole}`}
                data-testid="button-signin-google"
              >
                <SiGoogle className="h-5 w-5 text-[#4285F4]" />
                <span>Continue with Google</span>
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => window.location.href = `/api/auth/oauth/yahoo?role=${signupRole}`}
                data-testid="button-signin-yahoo"
              >
                <FaYahoo className="h-5 w-5 text-[#720E9E]" />
                <span>Continue with Yahoo</span>
              </Button>
            </div>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com"
                value={signinEmail}
                onChange={(e) => setSigninEmail(e.target.value)}
                data-testid="input-signin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showSigninPassword ? "text" : "password"}
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  data-testid="input-signin-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSigninPassword(!showSigninPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  data-testid="button-toggle-signin-password"
                >
                  {showSigninPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              className="w-full bg-black text-white hover:bg-gray-800"
              onClick={handleSignIn}
              data-testid="button-signin-submit"
            >
              {t.auth.signIn}
            </Button>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              {t.auth.dontHaveAccount}{" "}
              <button
                onClick={() => setActiveTab("signup")}
                className="text-black dark:text-white font-semibold hover:underline"
                data-testid="link-switch-signup"
              >
                {t.auth.signUp}
              </button>
            </p>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => window.location.href = `/api/auth/oauth/google?role=${signupRole}`}
                data-testid="button-signup-google"
              >
                <SiGoogle className="h-5 w-5 text-[#4285F4]" />
                <span>Continue with Google</span>
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => window.location.href = `/api/auth/oauth/yahoo?role=${signupRole}`}
                data-testid="button-signup-yahoo"
              >
                <FaYahoo className="h-5 w-5 text-[#720E9E]" />
                <span>Continue with Yahoo</span>
              </Button>
            </div>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or sign up with email
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">{t.auth.fullName}</Label>
              <div className="relative">
                <Input 
                  id="name" 
                  placeholder="John Doe"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  data-testid="input-signup-name"
                  className={
                    nameValidation.status === 'invalid' 
                      ? 'border-red-500 pr-10' 
                      : nameValidation.status === 'valid'
                      ? 'border-green-500 pr-10'
                      : ''
                  }
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {nameValidation.status === 'checking' && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {nameValidation.status === 'valid' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {nameValidation.status === 'invalid' && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              {nameValidation.message && (
                <p className={`text-xs ${nameValidation.status === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
                  {nameValidation.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">{t.auth.email}</Label>
              <div className="relative">
                <Input 
                  id="signup-email" 
                  type="email" 
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  data-testid="input-signup-email"
                  className={
                    emailValidation.status === 'invalid' 
                      ? 'border-red-500 pr-10' 
                      : emailValidation.status === 'valid'
                      ? 'border-green-500 pr-10'
                      : ''
                  }
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailValidation.status === 'checking' && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {emailValidation.status === 'valid' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {emailValidation.status === 'invalid' && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              {emailValidation.message && (
                <p className={`text-xs ${emailValidation.status === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
                  {emailValidation.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">{t.auth.password}</Label>
              <div className="relative">
                <Input 
                  id="signup-password" 
                  type={showSignupPassword ? "text" : "password"}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  data-testid="input-signup-password"
                  className={
                    passwordValidation.status === 'invalid' 
                      ? 'border-red-500 pr-10' 
                      : passwordValidation.status === 'valid'
                      ? 'border-green-500 pr-10'
                      : 'pr-10'
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  data-testid="button-toggle-signup-password"
                >
                  {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordValidation.message && (
                <p className={`text-xs ${passwordValidation.status === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordValidation.message}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.auth.passwordMinLength}
              </p>
            </div>
            <Button 
              className="w-full bg-black text-white hover:bg-gray-800"
              onClick={handleSignUp}
              disabled={
                emailValidation.status === 'invalid' || 
                nameValidation.status === 'invalid' ||
                passwordValidation.status === 'invalid' ||
                emailValidation.status === 'checking' ||
                nameValidation.status === 'checking' ||
                !signupPassword
              }
              data-testid="button-signup-submit"
            >
              {t.auth.createAccount}
            </Button>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              {t.auth.alreadyHaveAccount}{" "}
              <button
                onClick={() => setActiveTab("signin")}
                className="text-black dark:text-white font-semibold hover:underline"
                data-testid="link-switch-signin"
              >
                {t.auth.signIn}
              </button>
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
