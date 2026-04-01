import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { POPULAR_APPS } from '@/contexts/FocusContext';
import { AppLayout } from '@/components/AppLayout';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  blocked_apps: string[];
  is_active: boolean;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formApps, setFormApps] = useState<string[]>([]);

  const fetchSchedules = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('scheduled_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSchedules((data as Schedule[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSchedules(); }, [user]);

  const toggleDay = (d: number) => {
    setFormDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const toggleApp = (pkg: string) => {
    setFormApps(prev => prev.includes(pkg) ? prev.filter(x => x !== pkg) : [...prev, pkg]);
  };

  const handleCreate = async () => {
    if (!user || formDays.length === 0 || formApps.length === 0) {
      toast.error('Select days and apps');
      return;
    }
    await supabase.from('scheduled_sessions').insert({
      user_id: user.id,
      days_of_week: formDays,
      start_time: formStart,
      end_time: formEnd,
      blocked_apps: formApps,
    });
    toast.success('Schedule created!');
    setShowForm(false);
    setFormDays([1, 2, 3, 4, 5]);
    setFormApps([]);
    fetchSchedules();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('scheduled_sessions').update({ is_active: !current }).eq('id', id);
    fetchSchedules();
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from('scheduled_sessions').delete().eq('id', id);
    toast.success('Schedule deleted');
    fetchSchedules();
  };

  const getAppName = (pkg: string) => POPULAR_APPS.find(a => a.packageName === pkg)?.appName || pkg.split('.').pop();

  return (
    <AppLayout>
      <div className="pb-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)}
            className="gradient-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New
          </motion.button>
        </div>

        {/* Create Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 neon-border mb-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">New Schedule</h3>

            {/* Days */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Days</p>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      formDays.includes(i) ? 'gradient-primary text-primary-foreground' : 'glass text-muted-foreground'
                    }`}>{label}</button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Start</p>
                <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)}
                  className="w-full glass rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">End</p>
                <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)}
                  className="w-full glass rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
            </div>

            {/* Apps */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Block Apps</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_APPS.map(app => (
                  <button key={app.packageName} onClick={() => toggleApp(app.packageName)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      formApps.includes(app.packageName) ? 'gradient-primary text-primary-foreground' : 'glass text-muted-foreground'
                    }`}>
                    {app.icon} {app.appName}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleCreate}
              className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl">
              Create Schedule
            </button>
          </motion.div>
        )}

        {/* Schedules List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <CalendarClock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No schedules yet. Create one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass rounded-xl p-4 ${s.is_active ? 'neon-border' : 'opacity-60'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground font-mono">
                    {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(s.id, s.is_active)}>
                      {s.is_active ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                    </button>
                    <button onClick={() => deleteSchedule(s.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 mb-2">
                  {DAY_LABELS.map((label, di) => (
                    <span key={di} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      s.days_of_week.includes(di) ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                    }`}>{label}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.blocked_apps.map(pkg => (
                    <span key={pkg} className="text-[10px] glass rounded-full px-2 py-0.5 text-muted-foreground">
                      {getAppName(pkg)}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
