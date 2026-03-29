import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogOut, Mail, Calendar, Trophy, Flame, Clock, Shield, ChevronRight, Bell, Moon, Volume2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFocus } from '@/contexts/FocusContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { toast } from 'sonner';

interface ProfileData {
  full_name: string | null;
  wallet_balance: number;
  current_streak: number;
  best_streak: number;
  total_focus_minutes: number;
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [sounds, setSounds] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch { toast.error('Failed to log out'); }
  };

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const totalHours = profile ? Math.floor(profile.total_focus_minutes / 60) : 0;

  return (
    <AppLayout>
      <div className="pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        {/* Avatar & Name */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-5 flex items-center gap-4 neon-border">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center glow-primary">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{profile?.full_name || 'FocusLock User'}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" /> Joined {joinDate}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Flame, label: 'Streak', value: `${profile?.current_streak || 0}🔥`, color: 'text-orange-400' },
            { icon: Trophy, label: 'Best', value: `${profile?.best_streak || 0} days`, color: 'text-yellow-400' },
            { icon: Clock, label: 'Focus', value: `${totalHours}h`, color: 'text-primary' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-xl p-4 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.color}`} />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Settings */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Settings</h3>
        <div className="glass rounded-2xl divide-y divide-border mb-6">
          {[
            { icon: Bell, label: 'Notifications', toggle: true, value: notifications, onChange: () => setNotifications(!notifications) },
            { icon: Moon, label: 'Dark Mode', toggle: true, value: darkMode, onChange: () => { setDarkMode(!darkMode); toast('Dark mode is always on 🌙'); } },
            { icon: Volume2, label: 'Sound Effects', toggle: true, value: sounds, onChange: () => setSounds(!sounds) },
            { icon: Shield, label: 'Privacy & Security', toggle: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              {item.toggle ? (
                <button onClick={item.onChange}
                  className={`w-11 h-6 rounded-full transition-colors relative ${item.value ? 'bg-primary' : 'bg-muted'}`}>
                  <motion.div animate={{ x: item.value ? 20 : 2 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-primary-foreground" />
                </button>
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Account */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</h3>
        <div className="glass rounded-2xl mb-6">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <span className="text-sm text-foreground">Wallet Balance</span>
            <span className="text-sm font-bold text-primary">🪙 {profile?.wallet_balance || 0}</span>
          </div>
        </div>

        {/* Logout */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-destructive/40 text-destructive font-bold active:scale-95 transition-transform">
          <LogOut className="w-5 h-5" />
          Log Out
        </motion.button>
      </div>
    </AppLayout>
  );
}
