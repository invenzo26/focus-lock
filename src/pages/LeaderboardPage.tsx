import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Trophy, Timer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';

interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  total_focus_minutes: number;
  current_streak: number;
}

type Tab = 'hours' | 'streak';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<Tab>('hours');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const orderCol = tab === 'hours' ? 'total_focus_minutes' : 'current_streak';
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, total_focus_minutes, current_streak')
        .order(orderCol, { ascending: false })
        .limit(50);
      setEntries(data || []);
      setLoading(false);
    };
    fetch();
  }, [tab]);

  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (i === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (i === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>;
  };

  const getValue = (e: LeaderboardEntry) =>
    tab === 'hours' ? `${Math.floor(e.total_focus_minutes / 60)}h ${e.total_focus_minutes % 60}m` : `${e.current_streak} 🔥`;

  return (
    <AppLayout>
      <div className="pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-5">Leaderboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: 'hours' as Tab, label: 'Focus Hours', icon: Timer },
            { key: 'streak' as Tab, label: 'Streaks', icon: Trophy },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key ? 'gradient-primary text-primary-foreground glow-primary' : 'glass text-muted-foreground'
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">No data yet. Start focusing!</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isMe = entry.id === user?.id;
              return (
                <motion.div key={entry.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass rounded-xl p-3.5 flex items-center gap-3 ${
                    isMe ? 'neon-border' : ''
                  } ${i < 3 ? 'border border-yellow-500/20' : ''}`}>
                  <div className="w-8 flex justify-center">{getRankIcon(i)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                      {entry.full_name || 'Anonymous'} {isMe && '(You)'}
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono text-foreground">{getValue(entry)}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
