import { useState } from "react";
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

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
}

export const AuthDialog = ({ open, onOpenChange, defaultTab = "signin" }: AuthDialogProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

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
                data-testid="input-signin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                data-testid="input-signin-password"
              />
            </div>
            <Button 
              className="w-full bg-black text-white hover:bg-gray-800"
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
                data-testid="input-signup-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input 
                id="signup-email" 
                type="email" 
                placeholder="you@example.com"
                data-testid="input-signup-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input 
                id="signup-password" 
                type="password"
                data-testid="input-signup-password"
              />
            </div>
            <Button 
              className="w-full bg-black text-white hover:bg-gray-800"
              data-testid="button-signup-submit"
            >
              Create account
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
