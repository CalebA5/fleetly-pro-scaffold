import { useState, useEffect } from "react";
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
  
  // Update signup name when prefillName changes
  useEffect(() => {
    if (prefillName) {
      setSignupName(prefillName);
    }
  }, [prefillName]);

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
    try {
      await signUp(signupName, signupEmail, signupPassword, signupRole);
      toast({
        title: "Account created!",
        description: signupRole === "operator" 
          ? "Let's set up your operator profile."
          : "Welcome to Fleetly!",
      });
      onOpenChange(false);
      
      // Redirect based on role
      if (signupRole === "operator") {
        setLocation("/operator/onboarding");
      } else if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
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
              <Input 
                id="name" 
                placeholder="John Doe"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                data-testid="input-signup-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input 
                id="signup-email" 
                type="email" 
                placeholder="you@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                data-testid="input-signup-email"
              />
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
