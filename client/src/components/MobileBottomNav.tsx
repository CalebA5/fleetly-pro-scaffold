import { Home, Search, Heart, User, ClipboardList, LogIn, UserPlus, Truck, Wallet, LayoutDashboard, MapPin, CircleUser } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface MobileBottomNavProps {
  context?: "customer" | "operator";
}

// Pages that should use operator navigation
const OPERATOR_PAGES = [
  "/operator",
  "/wallet",
  "/profile"
];

// Pages that should always use customer navigation (homepage-connected)
const CUSTOMER_ONLY_PAGES = [
  "/",
  "/customer",
  "/drive-earn",
  "/signin",
  "/signup",
  "/browse-operators"
];

export function MobileBottomNav({ context = "customer" }: MobileBottomNavProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  
  // Persist operator context in sessionStorage to maintain navigation state
  useEffect(() => {
    if (location.startsWith("/operator")) {
      sessionStorage.setItem("navContext", "operator");
    } else if (location === "/" || location.startsWith("/customer") || location === "/drive-earn") {
      sessionStorage.setItem("navContext", "customer");
    }
  }, [location]);

  // Determine navigation context from URL, props, and persisted state
  const isOperatorContext = useMemo(() => {
    // Explicit context prop takes highest precedence
    if (context === "operator") return true;
    if (context === "customer") {
      // Only force customer if explicitly on customer-only pages
      if (location === "/" || location.startsWith("/customer") || location === "/drive-earn") return false;
    }
    
    // Check if on operator-specific pages
    if (location.startsWith("/operator")) return true;
    
    // Check URL params for operator context
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get("from");
    if (fromParam?.startsWith("/operator")) return true;
    
    // Check for tier param (indicates operator wallet view)
    const tierParam = urlParams.get("tier");
    if (tierParam && user?.operatorId) return true;
    
    // For shared pages like /wallet and /profile, check persisted context
    if (location === "/wallet" || location.startsWith("/wallet") || location === "/profile") {
      const persistedContext = sessionStorage.getItem("navContext");
      if (persistedContext === "operator" && user?.operatorId) return true;
    }
    
    return false;
  }, [context, location, user?.operatorId]);
  
  // Get current tier for wallet navigation
  const currentTier = user?.viewTier || user?.activeTier || user?.operatorTier;

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

  // Build wallet path with tier filter when navigating from operator context
  const walletPath = useMemo(() => {
    if (currentTier) {
      return `/wallet?tier=${currentTier}&from=/operator`;
    }
    return "/wallet";
  }, [currentTier]);

  const operatorNavItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/operator",
      testId: "nav-operator-dashboard"
    },
    {
      icon: MapPin,
      label: "Jobs",
      path: "/operator/nearby-jobs",
      testId: "nav-operator-jobs"
    },
    {
      icon: Wallet,
      label: "Wallet",
      path: walletPath,
      testId: "nav-operator-wallet"
    },
    {
      icon: Truck,
      label: "Earn",
      path: "/drive-earn",
      testId: "nav-operator-drive"
    },
    {
      icon: CircleUser,
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
      icon: ClipboardList,
      label: "Requests",
      path: "/customer/requests",
      testId: "nav-requests"
    },
    {
      icon: Heart,
      label: "Favorites",
      path: `/customer/favorites?from=${encodeURIComponent(location)}`,
      testId: "nav-favorites"
    },
    {
      icon: CircleUser,
      label: "Profile",
      path: "/profile",
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
      label: "Earn",
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

  const navItems = isOperatorContext ? operatorNavItems : customerNavItems;

  return (
    <nav 
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-inset-bottom transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          // Extract base path for comparison (remove query params)
          const basePath = item.path.split("?")[0];
          const isActive = location === basePath || 
            (basePath !== "/" && location.startsWith(basePath));
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all",
                  isActive
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                )}
                data-testid={item.testId}
              >
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-8 rounded-full transition-colors",
                  isActive && "bg-teal-50 dark:bg-teal-900/30"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-transform",
                    isActive && "scale-110"
                  )} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
