import { Home, Search, Heart, User, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const [location] = useLocation();

  const navItems = [
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
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16">
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
