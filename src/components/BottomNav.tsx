import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Timer, Lock, BarChart3, User, Trophy, CalendarClock, ShoppingBag } from 'lucide-react';
import { useFocus } from '@/contexts/FocusContext';

const TABS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/focus', icon: Timer, label: 'Focus' },
  { to: '/block', icon: Lock, label: 'Block' },
  { to: '/leaderboard', icon: Trophy, label: 'Rank' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { isFocusActive } = useFocus();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link key={to} to={to}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative">
              {isActive && (
                <motion.div layoutId="bottomNavIndicator" className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
