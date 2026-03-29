import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Flame, Zap, Play, Lock, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFocus } from '@/contexts/FocusContext';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { user } = useAuth();
  const { isFocusActive, selectedSites, tryOpenSite } = useFocus();
  const [stats, setStats] = useState({ totalSessions: 0, streak: 0, walletBalance: 0, totalFocusMinutes: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data: profile } = await supabase.from('profiles')
        .select('wallet_balance, current_streak, total_focus_minutes').eq('id', user.id).single();
      const { count: sessionCount } = await supabase.from('focus_sessions')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed');
      setStats({
        totalSessions: sessionCount || 0,
        streak: profile?.current_streak || 0,
        walletBalance: profile?.wallet_balance || 0,
        totalFocusMinutes: profile?.total_focus_minutes || 0,
      });
    };
    fetchStats();
  }, [user, isFocusActive]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'User';
  const focusHours = Math.floor(stats.totalFocusMinutes / 60);
  const focusMins = stats.totalFocusMinutes % 60;

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting()}, <br />{firstName} 👋</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 neon-border">
          <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold font-mono text-foreground">{stats.walletBalance}</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-4 neon-border">
          <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-warning" />
            <span className="text-2xl font-bold text-foreground">{stats.streak} Days</span>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Link to="/focus">
          <button className="w-full gradient-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl glow-neon flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <Zap className="w-5 h-5" />
            {isFocusActive ? 'View Active Session' : 'Start Focusing'}
          </button>
        </Link>
      </motion.div>

      {/* Quick test block on dashboard */}
      {isFocusActive && selectedSites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 neon-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">🔒 Blocked Sites ({selectedSites.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSites.map(site => (
              <motion.button key={site.id} whileTap={{ scale: 0.95 }}
                onClick={() => tryOpenSite(site)}
                className="glass rounded-lg px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 border border-destructive/20 active:scale-95">
                <span>{site.icon}</span>
                <span>{site.name}</span>
              </motion.button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Tap any site to test blocking</p>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-4 neon-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Today's Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Focus</p>
            <p className="text-xl font-bold text-foreground font-mono">{focusHours}h {focusMins}m</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sessions</p>
            <p className="text-xl font-bold text-foreground font-mono">{stats.totalSessions}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
        {[
          { to: '/focus', icon: Play, label: 'Quick Focus' },
          { to: '/block', icon: Lock, label: 'Block Apps & Websites' },
          { to: '/history', icon: BarChart3, label: 'History' },
        ].map(({ to, icon: Icon, label }, i) => (
          <Link key={to} to={to}>
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="glass rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
