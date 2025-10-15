import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, LogOut, Settings } from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";
import type { UserProfile } from "@/types";

interface DashboardHeaderProps {
  user: UserProfile;
  onLogout: () => Promise<void>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 h-16 px-4 md:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between">
      {/* Logo */}
      <a href="/dashboard" className="text-lg sm:text-xl font-bold hover:opacity-80 transition-opacity">
        10x cards
      </a>

      {/* Right side: Dark mode toggle + User menu */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Przełącz tryb ciemny"
          data-testid="toggle-theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full"
              aria-label="Menu użytkownika"
              data-testid="user-menu-trigger"
            >
              <Avatar>
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.username || user.email} />
                ) : (
                  <AvatarFallback>{getInitials(user.username || user.email)}</AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled className="cursor-default">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.username || "Użytkownik"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Ustawienia konta</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Wyloguj się</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
