import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  duration: number;
  reward: number;
}

export function SessionCompleteModal({ open, onClose, duration, reward }: Props) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl p-6"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex flex-col items-center text-center gap-5 max-w-sm"
        >
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 rounded-full gradient-primary glow-neon flex items-center justify-center"
          >
            <Trophy className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground">Session Complete! 🎉</h2>
          <p className="text-muted-foreground text-sm">
            You stayed focused for {duration} minutes. Amazing discipline!
          </p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-4 neon-border flex items-center gap-3"
          >
            <Coins className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-foreground">+{reward} Coins Earned</span>
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="mt-2 gradient-primary text-primary-foreground font-bold py-3 px-8 rounded-2xl glow-neon"
          >
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
