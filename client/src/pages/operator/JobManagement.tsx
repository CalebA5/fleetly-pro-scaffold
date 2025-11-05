import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { ArrowLeft, Truck } from "lucide-react";

export const JobManagement = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header 
        onSignIn={() => {
          setAuthTab("signin");
          setShowAuthDialog(true);
        }}
        onSignUp={() => {
          setAuthTab("signup");
          setShowAuthDialog(true);
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/operator">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-white">Job Management</h1>
        </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="w-5 h-5" />
            <span>Job Management Coming Soon</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Advanced job management features will be available here.
          </p>
        </CardContent>
      </Card>
      </div>
      
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        defaultTab={authTab}
      />
    </div>
  );
};