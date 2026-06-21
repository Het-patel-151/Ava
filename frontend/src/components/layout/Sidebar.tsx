import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Mic, MessageSquare, History, Bot, BarChart3,
  Files, Settings, User, ChevronLeft, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { UserAvatar } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: Home, label: 'Home', to: '/dashboard' },
  { icon: Mic, label: 'Voice', to: '/dashboard/voice' },
  { icon: MessageSquare, label: 'Chat', to: '/dashboard/chat' },
  { icon: History, label: 'Conversations', to: '/dashboard/conversations' },
  { icon: Bot, label: 'AI Agents', to: '/dashboard/agents' },
  { icon: BarChart3, label: 'Analytics', to: '/dashboard/analytics' },
  { icon: Files, label: 'Files', to: '/dashboard/files' },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', to: '/dashboard/settings' },
  { icon: User, label: 'Profile', to: '/dashboard/profile' },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: open ? 240 : 64 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-full bg-card border-r border-border/50 overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50 min-h-[65px]">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center glow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-lg text-gradient whitespace-nowrap"
            >
              AVA
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }) => {
          const isActive = to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to}>
              <div
                className={cn(
                  'flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150 group relative',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className={cn('w-5 h-5 flex-shrink-0 relative z-10', isActive && 'text-primary')} />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap relative z-10"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-1 border-t border-border/50 pt-4">
        {bottomItems.map(({ icon: Icon, label, to }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to}>
              <div className={cn(
                'flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150',
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {open && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium whitespace-nowrap">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          );
        })}

        {/* User */}
        {user && (
          <div className={cn('flex items-center gap-3 px-2 py-2 mt-2 rounded-xl glass', !open && 'justify-center')}>
            <UserAvatar name={user.name} avatar={user.avatar} className="w-7 h-7 flex-shrink-0" />
            <AnimatePresence>
              {open && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full border border-border bg-card shadow-md z-30"
      >
        <ChevronLeft className={cn('w-3 h-3 transition-transform', !open && 'rotate-180')} />
      </Button>
    </motion.aside>
  );
}
