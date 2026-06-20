import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Sun, Moon, Monitor, LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { UserAvatar } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';

interface NavbarProps { onMenuClick: () => void; }

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/auth/login');
  };

  const themeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const ThemeIcon = themeIcon;
  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';

  return (
    <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center gap-4 px-4 shrink-0">
      <Button variant="ghost" size="icon-sm" onClick={onMenuClick} className="text-muted-foreground">
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="h-8 bg-muted/50"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon-sm" onClick={() => setTheme(nextTheme)} className="text-muted-foreground">
          <ThemeIcon className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </Button>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="rounded-full">
                <UserAvatar name={user.name} avatar={user.avatar} className="w-7 h-7" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                <User className="w-4 h-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
