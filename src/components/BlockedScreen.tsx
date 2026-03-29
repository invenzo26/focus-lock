import { motion, AnimatePresence } from 'framer-motion';
import { ShieldBan, Unlock, ShieldCheck, Lock } from 'lucide-react';
import { useFocus } from '@/contexts/FocusContext';
import { useState } from 'react';
import { BreakFocusDialog } from './BreakFocusDialog';

export function BlockedScreen() {
  const { blockedAttempt, clearBlockedAttempt, penaltyAmount, breakSession, remainingTime } = useFocus();
  const [showBreak, setShowBreak] = useState(false);

  const m = Math.floor(remainingTime / 60);
  const s = remainingTime % 60;

  return (
    <AnimatePresence>
      {blockedAttempt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(180deg, hsl(260 20% 4%), hsl(0 60% 8%), hsl(260 20% 4%))' }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="flex flex-col items-center text-center gap-5 max-w-sm w-full"
          >
            {/* Pulsing shield */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-28 h-28 rounded-full bg-destructive/20 flex items-center justify-center border-2 border-destructive/40"
            >
              <ShieldBan className="w-14 h-14 text-destructive" />
            </motion.div>

            <h2 className="text-3xl font-bold text-foreground">🚫 Access Blocked</h2>

            <div className="glass rounded-2xl p-5 w-full neon-border space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{blockedAttempt.icon}</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">{blockedAttempt.name}</p>
                  <p className="text-xs text-muted-foreground">{blockedAttempt.domain}</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <p className="text-sm text-muted-foreground">
                You are in <span className="text-primary font-semibold">Focus Mode</span>. This website is blocked to keep you productive.
              </p>
            </div>

            {/* Timer */}
            <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Unlocks in</span>
              <span className="font-mono font-bold text-foreground text-lg">
                {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
              </span>
            </div>

            {/* Actions */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearBlockedAttempt}
              className="w-full gradient-primary text-primary-foreground font-bold py-4 rounded-2xl glow-neon flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Continue Focus ✅
            </motion.button>

            <button
              onClick={() => setShowBreak(true)}
              className="px-6 py-3 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Unlock className="w-4 h-4" />
              Break Focus (₹{penaltyAmount} Penalty)
            </button>
          </motion.div>

          <BreakFocusDialog
            open={showBreak}
            onOpenChange={setShowBreak}
            penalty={penaltyAmount}
            onConfirm={async () => {
              setShowBreak(false);
              await breakSession();
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
