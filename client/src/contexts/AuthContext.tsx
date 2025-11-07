import { createContext, useContext, useState, ReactNode } from "react";

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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: "customer" | "operator") => Promise<void>;
  signOut: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple in-memory user database for demo purposes
// In production, this would be persisted in a real database
const userDatabase = new Map<string, User>();

// Seed demo business user credentials
const demoCredentials = {
  email: "demo@arcticexpress.com",
  password: "demo", // In production, this would be hashed
};

// Pre-seed the demo business user
const demoUser: User = {
  id: "demo-business-owner",
  name: "Arctic Express Services",
  email: "demo@arcticexpress.com",
  role: "business",
  operatorProfileComplete: true,
  operatorTier: "professional",
  subscribedTiers: ["professional"],
  activeTier: "professional",
  operatorId: "BIZ-DEMO-001",
  businessId: "BIZ-DEMO-001",
};
userDatabase.set(demoUser.id, demoUser);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    // Check for demo business credentials
    if (email === demoCredentials.email && password === demoCredentials.password) {
      setUser(demoUser);
      return;
    }
    
    // Look up existing user or create a default customer
    let existingUser = Array.from(userDatabase.values()).find(u => u.email === email);
    
    if (!existingUser) {
      // Create new customer user if not found
      existingUser = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        role: "customer",
        operatorProfileComplete: false,
      };
      userDatabase.set(existingUser.id, existingUser);
    }
    
    // Migrate existing operators: create backend record if missing
    if (existingUser.role === "operator" && existingUser.operatorId) {
      try {
        // Try to create operator in backend (will fail gracefully if already exists)
        const response = await fetch("/api/operators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operatorId: existingUser.operatorId,
            name: existingUser.name,
            email: existingUser.email,
            operatorTier: existingUser.operatorTier || "manual",
          }),
        });
        
        // 409 means already exists, which is fine
        if (!response.ok && response.status !== 409) {
          console.error("Failed to create operator in backend");
        }
      } catch (error) {
        console.error("Error creating operator:", error);
        // Continue with signin even if backend fails
      }
    }
    
    setUser(existingUser);
  };

  const signUp = async (name: string, email: string, password: string, role: "customer" | "operator") => {
    // Mock sign up - create and store new user
    const userId = `user-${Date.now()}`;
    const operatorId = role === "operator" ? `OP-${userId}` : undefined;
    
    const newUser: User = {
      id: userId,
      name: name,
      email: email,
      role: role,
      operatorProfileComplete: false,
      // Assign operatorId immediately for operators so they can see TierSwitcher
      operatorId,
    };
    
    // If creating an operator, also create operator record in backend
    if (role === "operator" && operatorId) {
      try {
        const response = await fetch("/api/operators", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operatorId,
            name,
            email,
            operatorTier: "manual",
          }),
        });
        
        if (!response.ok && response.status !== 409) {
          // 409 means already exists, which is okay (duplicate signup attempt)
          console.error("Failed to create operator in backend");
        }
      } catch (error) {
        console.error("Error creating operator:", error);
        // Continue with signup even if backend fails
      }
    }
    
    userDatabase.set(newUser.id, newUser);
    setUser(newUser);
  };

  const signOut = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      // Update in database
      userDatabase.set(user.id, updatedUser);
      // Update in state
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        updateUser,
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
