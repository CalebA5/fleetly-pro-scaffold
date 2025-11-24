import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

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
  
  // Validation states
  const [emailValidation, setEmailValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });
  
  const [nameValidation, setNameValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });
  
  // Update signup name when prefillName changes
  useEffect(() => {
    if (prefillName) {
      setSignupName(prefillName);
    }
  }, [prefillName]);
  
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
      await signIn(signinEmail, signinPassword);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      onOpenChange(false);
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async () => {
    // Prevent signup if validation is invalid
    if (emailValidation.status === 'invalid' || nameValidation.status === 'invalid') {
      toast({
        title: "Validation Error",
        description: "Please resolve the errors before signing up.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await signUp(signupName, signupEmail, signupPassword, signupRole);
      toast({
        title: "Account created!",
        description: signupRole === "operator" 
          ? "Let's set up your operator profile."
          : "Welcome to Fleetly!",
      });
      onOpenChange(false);
      
      // Call onAuthSuccess callback if provided (e.g., for tier registration)
      if (onAuthSuccess) {
        onAuthSuccess();
      } else if (signupRole === "operator") {
        // Only redirect if no callback (default behavior)
        setLocation("/operator/onboarding");
      }
    } catch (error: any) {
      // Handle detailed error messages from backend
      const errorMessage = error?.message || 'Failed to create account. Please try again.';
      const errorDetails = error?.details;
      
      let description = errorMessage;
      if (errorDetails) {
        description = errorDetails.email || errorDetails.name || errorMessage;
      }
      
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Welcome to Fleetly</DialogTitle>
          <DialogDescription>
            Sign in to request services and track your jobs
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" data-testid="tab-signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup" data-testid="tab-signup">Sign up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={signinPassword}
                onChange={(e) => setSigninPassword(e.target.value)}
                data-testid="input-signin-password"
              />
            </div>
            <Button 
              className="w-full bg-black text-white hover:bg-gray-800"
              onClick={handleSignIn}
              data-testid="button-signin-submit"
            >
              Sign in
            </Button>
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => setActiveTab("signup")}
                className="text-black font-semibold hover:underline"
                data-testid="link-switch-signup"
              >
                Sign up
              </button>
            </p>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
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
              <Label htmlFor="signup-email">Email</Label>
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
              <Label htmlFor="signup-password">Password</Label>
              <Input 
                id="signup-password" 
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                data-testid="input-signup-password"
              />
            </div>
            <Button 
              className="w-full bg-black text-white hover:bg-gray-800"
              onClick={handleSignUp}
              disabled={
                emailValidation.status === 'invalid' || 
                nameValidation.status === 'invalid' ||
                emailValidation.status === 'checking' ||
                nameValidation.status === 'checking'
              }
              data-testid="button-signup-submit"
            >
              {signupRole === "operator" ? "Sign up as Operator" : "Create account"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("signin")}
                className="text-black font-semibold hover:underline"
                data-testid="link-switch-signin"
              >
                Sign in
              </button>
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
