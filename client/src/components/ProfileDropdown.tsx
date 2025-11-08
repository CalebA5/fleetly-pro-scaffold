import { User, LogOut, HelpCircle, FileText, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileDropdownProps {
  onDriveAndEarn?: () => void;
}

export const ProfileDropdown = ({ onDriveAndEarn }: ProfileDropdownProps) => {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full"
          data-testid="button-profile-menu"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <Link href="/customer/profile">
          <DropdownMenuItem data-testid="menu-profile">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem
          onClick={onDriveAndEarn}
          data-testid="menu-drive-earn"
        >
          <Truck className="mr-2 h-4 w-4" />
          <span>Drive & Earn</span>
        </DropdownMenuItem>
        <Link href="/customer/operator-map">
          <DropdownMenuItem data-testid="menu-request-services">
            <FileText className="mr-2 h-4 w-4" />
            <span>Request Services</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/help">
          <DropdownMenuItem data-testid="menu-help">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} data-testid="menu-sign-out">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
