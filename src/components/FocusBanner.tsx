import { motion } from 'framer-motion';
import { Flame, Lock } from 'lucide-react';
import { useFocus } from '@/contexts/FocusContext';
import { Link } from 'react-router-dom';

export function FocusBanner() {
  const { isFocusActive, remainingTime, selectedSites } = useFocus();
  if (!isFocusActive) return null;

  const m = Math.floor(remainingTime / 60);
  const s = remainingTime % 60;

  return (
    <Link to="/focus">
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-3 gradient-primary rounded-xl px-4 py-2.5 flex items-center justify-between glow-neon"
      >
        <div className="flex items-center gap-2 text-primary-foreground">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-semibold">Focus Active</span>
          <span className="text-[10px] opacity-75">• {selectedSites.length} blocked</span>
        </div>
        <div className="flex items-center gap-1.5 text-primary-foreground">
          <Lock className="w-3 h-3" />
          <span className="text-sm font-mono font-bold">
            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
