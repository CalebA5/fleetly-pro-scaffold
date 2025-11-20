import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "operator" | "both" | "business";
  operatorProfileComplete?: boolean;
  operatorTier?: "professional" | "equipped" | "manual";
  subscribedTiers?: ("professional" | "equipped" | "manual")[];
  activeTier?: "professional" | "equipped" | "manual";
  operatorId?: string;
  businessId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: "customer" | "operator") => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id || userData.userId,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            operatorProfileComplete: userData.operatorProfileComplete,
            operatorTier: userData.operatorTier,
            subscribedTiers: userData.subscribedTiers,
            activeTier: userData.activeTier,
            operatorId: userData.operatorId,
            businessId: userData.businessId,
          });
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sign in");
      }

      const userData = await response.json();
      setUser({
        id: userData.id || userData.userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        operatorProfileComplete: userData.operatorProfileComplete,
        operatorTier: userData.operatorTier,
        subscribedTiers: userData.subscribedTiers,
        activeTier: userData.activeTier,
        operatorId: userData.operatorId,
        businessId: userData.businessId,
      });
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string, role: "customer" | "operator") => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sign up");
      }

      const userData = await response.json();
      setUser({
        id: userData.id || userData.userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        operatorProfileComplete: userData.operatorProfileComplete,
        operatorTier: userData.operatorTier,
        subscribedTiers: userData.subscribedTiers,
        activeTier: userData.activeTier,
        operatorId: userData.operatorId,
        businessId: userData.businessId,
      });
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prevUser) => prevUser ? { ...prevUser, ...updates } : null);
  };

  const refetchUser = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id || userData.userId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          operatorProfileComplete: userData.operatorProfileComplete,
          operatorTier: userData.operatorTier,
          subscribedTiers: userData.subscribedTiers,
          activeTier: userData.activeTier,
          operatorId: userData.operatorId,
          businessId: userData.businessId,
        });
      }
    } catch (error) {
      console.error("Failed to refetch user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateUser,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
