import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";

export const SignUp = () => {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(true);
  const { t } = useI18n();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    setLocation("/");
  };

  const handleClose = () => {
    setShowAuthDialog(false);
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={handleClose}
        defaultTab="signup"
        signupRole="customer"
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};
