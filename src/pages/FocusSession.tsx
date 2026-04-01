import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, Unlock, Zap, ShieldAlert } from 'lucide-react';
import { useFocus } from '@/contexts/FocusContext';
import { BreakFocusDialog } from '@/components/BreakFocusDialog';
import { StartFocusModal } from '@/components/StartFocusModal';
import { SessionCompleteModal } from '@/components/SessionCompleteModal';
import { FocusSounds } from '@/components/FocusSounds';

export default function FocusSession() {
  const {
    isFocusActive, remainingTime, totalDuration, penaltyAmount,
    selectedApps, startSession, breakSession, completeSession, tick,
  } = useFocus();

  const [showSetup, setShowSetup] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completedDuration, setCompletedDuration] = useState(0);
  const completingRef = useRef(false);

  // Tick every second using system clock (via tick())
  useEffect(() => {
    if (!isFocusActive) return;
    // Immediately sync on mount/resume
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isFocusActive, tick]);

  // Also sync on visibility change (app resume)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isFocusActive) {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isFocusActive, tick]);

  // Complete when timer hits 0
  useEffect(() => {
    if (isFocusActive && remainingTime <= 0 && !completingRef.current) {
      completingRef.current = true;
      setCompletedDuration(Math.round(totalDuration / 60));
      completeSession().then(() => {
        setShowComplete(true);
        completingRef.current = false;
      });
    }
  }, [isFocusActive, remainingTime, totalDuration, completeSession]);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const progress = totalDuration > 0 ? 1 - remainingTime / totalDuration : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  const handleStartSetup = () => setShowSetup(true);
  const handleStartSession = async (duration: number, apps: any[], penalty: number) => {
    setShowSetup(false);
    await startSession(duration, apps, penalty);
  };

  const handleBreak = async () => {
    setShowBreakDialog(false);
    await breakSession();
  };

  return (
    <div className="flex flex-col items-center pt-4 pb-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Focus</h1>

      {/* Timer Ring */}
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-64 h-64 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="120" fill="none" stroke="hsl(260 12% 14%)" strokeWidth="6" />
          <motion.circle cx="130" cy="130" r="120" fill="none" stroke="url(#neonGradient)" strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ filter: 'drop-shadow(0 0 8px hsl(270 100% 65% / 0.6))' }} />
          <defs>
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(270 100% 65%)" />
              <stop offset="100%" stopColor="hsl(290 80% 55%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-5xl font-bold text-foreground tracking-wider neon-text">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            {isFocusActive ? 'remaining' : 'ready'}
          </span>
        </div>
      </motion.div>

      {/* Blocked apps badges */}
      {isFocusActive && selectedApps.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5 justify-center mb-4 px-4">
          {selectedApps.slice(0, 5).map(a => (
            <span key={a.packageName} className="glass rounded-full px-2.5 py-1 text-[10px] text-muted-foreground">{a.icon} {a.appName}</span>
          ))}
          {selectedApps.length > 5 && (
            <span className="glass rounded-full px-2.5 py-1 text-[10px] text-muted-foreground">+{selectedApps.length - 5}</span>
          )}
        </motion.div>
      )}

      {/* Controls */}
      {!isFocusActive ? (
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleStartSetup}
          className="mt-6 w-full max-w-xs gradient-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl glow-neon flex items-center justify-center gap-2">
          <Zap className="w-5 h-5" />
          Start Focusing
        </motion.button>
      ) : (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setShowBreakDialog(true)}
          className="mt-8 px-6 py-3 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform">
          <Unlock className="w-4 h-4" />
          Break Focus (₹{penaltyAmount})
        </motion.button>
      )}

      {/* Blocked apps list */}
      {isFocusActive && selectedApps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 w-full max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Blocked Apps</h3>
          </div>
          <div className="space-y-2">
            {selectedApps.map(app => (
              <div key={app.packageName}
                className="w-full rounded-xl p-3 flex items-center justify-between glass border border-destructive/30">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{app.icon}</span>
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground">{app.appName}</span>
                    <span className="text-[10px] text-muted-foreground block">{app.packageName}</span>
                  </div>
                </div>
                <span className="text-[10px] text-destructive font-semibold px-2 py-0.5 rounded-full bg-destructive/10">BLOCKED</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Focus Sounds */}
      {isFocusActive && <FocusSounds />}

      {/* Modals */}
      <StartFocusModal open={showSetup} onClose={() => setShowSetup(false)} onStart={handleStartSession} />
      <BreakFocusDialog open={showBreakDialog} onOpenChange={setShowBreakDialog} penalty={penaltyAmount} onConfirm={handleBreak} />
      <SessionCompleteModal open={showComplete} onClose={() => setShowComplete(false)} duration={completedDuration} reward={50} />
    </div>
  );
}
