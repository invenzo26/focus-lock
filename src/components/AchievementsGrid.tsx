import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

export function AchievementsGrid() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: all }, { data: mine }] = await Promise.all([
        supabase.from('achievements').select('*'),
        supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
      ]);
      setAchievements((all as Achievement[]) || []);
      setUnlocked((mine || []).map((m: any) => m.achievement_id));
    };
    fetch();
  }, [user]);

  if (achievements.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Achievements</h3>
      <div className="grid grid-cols-3 gap-2">
        {achievements.map((a, i) => {
          const isUnlocked = unlocked.includes(a.id);
          return (
            <motion.div key={a.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`glass rounded-xl p-3 text-center ${isUnlocked ? 'neon-border' : 'opacity-40'}`}>
              <span className="text-2xl block mb-1">{a.icon}</span>
              <p className="text-[10px] font-semibold text-foreground leading-tight">{a.name}</p>
              {isUnlocked && <p className="text-[8px] text-primary mt-0.5">✓ Unlocked</p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
