import { Home, Search, Heart, User, FileText, LogIn, UserPlus, Truck, Wallet, LayoutDashboard, Briefcase } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface MobileBottomNavProps {
  context?: "customer" | "operator";
}

export function MobileBottomNav({ context = "customer" }: MobileBottomNavProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const isOnOperatorDashboard = context === "operator" || location.startsWith("/operator");

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const operatorNavItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/operator",
      testId: "nav-operator-dashboard"
    },
    {
      icon: Briefcase,
      label: "Jobs",
      path: "/operator/nearby-jobs",
      testId: "nav-operator-jobs"
    },
    {
      icon: Wallet,
      label: "Wallet",
      path: "/wallet",
      testId: "nav-operator-wallet"
    },
    {
      icon: Truck,
      label: "Drive & Earn",
      path: "/drive-earn",
      testId: "nav-operator-drive"
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile",
      testId: "nav-operator-profile"
    }
  ];

  const customerNavItems = user ? [
    {
      icon: Home,
      label: "Home",
      path: "/",
      testId: "nav-home"
    },
    {
      icon: Search,
      label: "Browse",
      path: "/customer/operators",
      testId: "nav-browse"
    },
    {
      icon: FileText,
      label: "Requests",
      path: "/customer/requests",
      testId: "nav-requests"
    },
    {
      icon: Heart,
      label: "Favorites",
      path: "/customer/favorites",
      testId: "nav-favorites"
    },
    {
      icon: User,
      label: "Profile",
      path: "/customer/profile",
      testId: "nav-profile"
    }
  ] : [
    {
      icon: Home,
      label: "Home",
      path: "/",
      testId: "nav-home"
    },
    {
      icon: Search,
      label: "Browse",
      path: "/customer/operators",
      testId: "nav-browse"
    },
    {
      icon: Truck,
      label: "Drive & Earn",
      path: "/drive-earn",
      testId: "nav-drive-earn"
    },
    {
      icon: LogIn,
      label: "Sign In",
      path: "/signin",
      testId: "nav-signin"
    },
    {
      icon: UserPlus,
      label: "Sign Up",
      path: "/signup",
      testId: "nav-signup"
    }
  ];

  const navItems = isOnOperatorDashboard ? operatorNavItems : customerNavItems;

  return (
    <nav 
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-inset-bottom transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className={cn("grid h-16", user ? "grid-cols-5" : "grid-cols-5")}>
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                  isActive
                    ? "text-black dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                )}
                data-testid={item.testId}
              >
                <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
