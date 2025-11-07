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

// No demo accounts - clean slate for all users

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    // Look up existing user in memory
    let existingUser = Array.from(userDatabase.values()).find(u => u.email === email);
    
    if (!existingUser) {
      // Check if this email belongs to an existing operator in the backend
      try {
        const response = await fetch("/api/operators");
        if (response.ok) {
          const operators = await response.json();
          const operatorRecord = operators.find((op: any) => op.email === email);
          
          if (operatorRecord) {
            // Recreate operator user from backend data
            existingUser = {
              id: `user-${Date.now()}`,
              name: operatorRecord.name,
              email: operatorRecord.email,
              role: "operator",
              operatorProfileComplete: true,
              operatorId: operatorRecord.operatorId,
              operatorTier: operatorRecord.operatorTier || "manual",
              subscribedTiers: operatorRecord.subscribedTiers || [operatorRecord.operatorTier || "manual"],
              activeTier: operatorRecord.activeTier || operatorRecord.operatorTier || "manual",
              businessId: operatorRecord.businessId,
            };
          } else {
            // Create new customer user if not found in backend either
            existingUser = {
              id: `user-${Date.now()}`,
              name: email.split('@')[0],
              email: email,
              role: "customer",
              operatorProfileComplete: false,
            };
          }
        } else {
          // If backend fails, default to customer
          existingUser = {
            id: `user-${Date.now()}`,
            name: email.split('@')[0],
            email: email,
            role: "customer",
            operatorProfileComplete: false,
          };
        }
      } catch (error) {
        console.error("Error checking backend for operator:", error);
        // Default to customer if backend check fails
        existingUser = {
          id: `user-${Date.now()}`,
          name: email.split('@')[0],
          email: email,
          role: "customer",
          operatorProfileComplete: false,
        };
      }
      
      userDatabase.set(existingUser.id, existingUser);
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
