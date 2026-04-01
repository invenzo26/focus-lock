import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Clock, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface DailyData { day: string; minutes: number; }
interface Stats { avgSession: number; totalSessions: number; bestDay: string; totalHours: number; }

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<DailyData[]>([]);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<Stats>({ avgSession: 0, totalSessions: 0, bestDay: '-', totalHours: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: sessions } = await supabase
        .from('focus_sessions')
        .select('created_at, duration_minutes, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (!sessions || sessions.length === 0) { setLoading(false); return; }

      // Last 7 days chart
      const last7: DailyData[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const mins = sessions.filter(s => s.created_at.startsWith(key)).reduce((sum, s) => sum + s.duration_minutes, 0);
        last7.push({ day: dayNames[d.getDay()], minutes: mins });
      }
      setChartData(last7);

      // Heatmap (last 90 days)
      const hm: Record<string, number> = {};
      sessions.forEach(s => {
        const key = s.created_at.split('T')[0];
        hm[key] = (hm[key] || 0) + s.duration_minutes;
      });
      setHeatmap(hm);

      // Stats
      const totalMins = sessions.reduce((s, x) => s + x.duration_minutes, 0);
      const dayTotals: Record<string, number> = {};
      sessions.forEach(s => {
        const d = new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'long' });
        dayTotals[d] = (dayTotals[d] || 0) + s.duration_minutes;
      });
      const bestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      setStats({
        avgSession: sessions.length > 0 ? Math.round(totalMins / sessions.length) : 0,
        totalSessions: sessions.length,
        bestDay,
        totalHours: Math.floor(totalMins / 60),
      });
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Generate heatmap grid (last 12 weeks)
  const heatmapWeeks = () => {
    const weeks: string[][] = [];
    for (let w = 11; w >= 0; w--) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date();
        date.setDate(date.getDate() - (w * 7 + (6 - d)));
        week.push(date.toISOString().split('T')[0]);
      }
      weeks.push(week);
    }
    return weeks;
  };

  const getHeatColor = (mins: number) => {
    if (!mins) return 'bg-secondary';
    if (mins < 30) return 'bg-primary/20';
    if (mins < 60) return 'bg-primary/40';
    if (mins < 120) return 'bg-primary/70';
    return 'bg-primary';
  };

  return (
    <AppLayout>
      <div className="pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-5">Analytics</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: Clock, label: 'Avg Session', value: `${stats.avgSession}m`, color: 'text-primary' },
                { icon: Target, label: 'Sessions', value: stats.totalSessions.toString(), color: 'text-primary' },
                { icon: TrendingUp, label: 'Total Hours', value: `${stats.totalHours}h`, color: 'text-primary' },
                { icon: Calendar, label: 'Best Day', value: stats.bestDay, color: 'text-primary' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-4 text-center">
                  <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color}`} />
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Weekly Chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 neon-border mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">This Week</h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="day" tick={{ fill: 'hsl(260 8% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(260 8% 50%)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: 'hsl(260 15% 10%)', border: '1px solid hsl(270 100% 65% / 0.3)', borderRadius: 8, fontSize: 12, color: '#fff' }}
                      formatter={(v: number) => [`${v} min`, 'Focus']} />
                    <Bar dataKey="minutes" fill="hsl(270 100% 65%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Heatmap */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-4 neon-border">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Focus Heatmap</h3>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {heatmapWeeks().map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map(day => (
                      <div key={day} className={`w-3.5 h-3.5 rounded-sm ${getHeatColor(heatmap[day] || 0)}`}
                        title={`${day}: ${heatmap[day] || 0} min`} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-secondary" />
                <div className="w-3 h-3 rounded-sm bg-primary/20" />
                <div className="w-3 h-3 rounded-sm bg-primary/40" />
                <div className="w-3 h-3 rounded-sm bg-primary/70" />
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>More</span>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
