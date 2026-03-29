import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, Coins, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Session {
  id: string;
  duration_minutes: number;
  status: string;
  created_at: string;
  penalty_amount: number;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setSessions(data || []);
        setLoading(false);
      });
  }, [user]);

  // Build simple calendar-like dots for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const activeDays = new Set(
    sessions
      .filter(s => {
        const d = new Date(s.created_at);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map(s => new Date(s.created_at).getDate())
  );

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold text-foreground mb-5">Session History</h1>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 neon-border mb-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">{monthName}</h3>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, i) => (
            <span key={i} className="text-[10px] text-muted-foreground font-medium py-1">{d}</span>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isActive = activeDays.has(day);
            const isToday = day === today.getDate();
            return (
              <div
                key={day}
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isActive
                    ? 'gradient-primary text-primary-foreground glow-primary'
                    : isToday
                    ? 'border border-primary/40 text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Sessions List */}
      <h3 className="text-sm font-semibold text-foreground mb-3">Sessions</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No sessions yet</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-xl p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  s.status === 'completed' ? 'bg-primary/15' : 'bg-destructive/15'
                }`}>
                  {s.status === 'completed' ? (
                    <Timer className="w-4 h-4 text-primary" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {s.duration_minutes}m {s.status === 'completed' ? 'Focus' : 'Break'}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {', '}
                    {new Date(s.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-bold font-mono ${
                s.status === 'completed' ? 'text-primary' : 'text-destructive'
              }`}>
                {s.status === 'completed' ? '+50' : `-${s.penalty_amount}`}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
