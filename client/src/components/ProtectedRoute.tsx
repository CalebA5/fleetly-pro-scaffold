import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOperator?: boolean;
}

export const ProtectedRoute = ({ children, requireOperator = false }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access this page",
          variant: "destructive",
        });
        setLocation("/");
      } else if (requireOperator && !user?.operatorId) {
        toast({
          title: "Operator Access Only",
          description: "You need to register as an operator to access this page",
          variant: "destructive",
        });
        setLocation("/");
      }
    }
  }, [isAuthenticated, isLoading, user, requireOperator, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (requireOperator && !user?.operatorId)) {
    return null;
  }

  return <>{children}</>;
};
