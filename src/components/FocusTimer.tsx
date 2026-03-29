import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BreakFocusDialog } from './BreakFocusDialog';

interface FocusTimerProps {
  duration: number; // in minutes
  penalty: number;
  onComplete: () => void;
  onBreak: () => void;
  isActive: boolean;
}

export function FocusTimer({ duration, penalty, onComplete, onBreak, isActive }: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showBreakDialog, setShowBreakDialog] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / (duration * 60);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-8"
      >
        {/* Timer Circle */}
        <div className="relative w-64 h-64">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <motion.circle
              cx="50" cy="50" r="45" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="drop-shadow-[0_0_8px_hsl(145_80%_42%_/_0.5)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={timeLeft}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-mono text-5xl font-bold text-foreground tracking-wider"
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </motion.div>
            <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-sm">
              <Lock className="w-3.5 h-3.5" />
              <span>Focus Locked</span>
            </div>
          </div>
        </div>

        {/* Break Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={() => setShowBreakDialog(true)}
          className="glow-danger gap-2"
        >
          <Unlock className="w-4 h-4" />
          Break Focus (₹{penalty})
        </Button>
      </motion.div>

      <BreakFocusDialog
        open={showBreakDialog}
        onOpenChange={setShowBreakDialog}
        penalty={penalty}
        onConfirm={() => {
          setShowBreakDialog(false);
          onBreak();
        }}
      />
    </>
  );
}
