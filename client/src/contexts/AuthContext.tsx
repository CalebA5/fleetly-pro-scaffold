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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    // Mock sign in - look up existing user or create a default customer
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
    
    setUser(existingUser);
  };

  const signUp = async (name: string, email: string, password: string, role: "customer" | "operator") => {
    // Mock sign up - create and store new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name,
      email: email,
      role: role,
      operatorProfileComplete: false,
    };
    
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
