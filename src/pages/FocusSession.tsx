import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, Unlock, Zap, ExternalLink, ShieldAlert } from 'lucide-react';
import { useFocus, PREDEFINED_SITES } from '@/contexts/FocusContext';
import { BreakFocusDialog } from '@/components/BreakFocusDialog';
import { StartFocusModal } from '@/components/StartFocusModal';
import { SessionCompleteModal } from '@/components/SessionCompleteModal';

export default function FocusSession() {
  const {
    isFocusActive, remainingTime, totalDuration, penaltyAmount,
    selectedSites, startSession, breakSession, completeSession, tick, tryOpenSite,
  } = useFocus();

  const [isPaused, setIsPaused] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completedDuration, setCompletedDuration] = useState(0);

  useEffect(() => {
    if (!isFocusActive || isPaused) return;
    if (remainingTime <= 0) {
      setCompletedDuration(Math.round(totalDuration / 60));
      completeSession().then(() => setShowComplete(true));
      return;
    }
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isFocusActive, isPaused, remainingTime, tick, completeSession, totalDuration]);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const progress = totalDuration > 0 ? 1 - remainingTime / totalDuration : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  const handleStartSetup = () => setShowSetup(true);
  const handleStartSession = async (duration: number, sites: any[], penalty: number) => {
    setShowSetup(false);
    setIsPaused(false);
    await startSession(duration, sites, penalty);
  };

  const handleBreak = async () => {
    setShowBreakDialog(false);
    await breakSession();
  };

  // Test sites for simulation
  const testSites = PREDEFINED_SITES.slice(0, 5);

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
            {isFocusActive ? (isPaused ? 'paused' : 'remaining') : 'ready'}
          </span>
        </div>
      </motion.div>

      {/* Blocked sites badges */}
      {isFocusActive && selectedSites.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5 justify-center mb-4 px-4">
          {selectedSites.slice(0, 5).map(s => (
            <span key={s.id} className="glass rounded-full px-2.5 py-1 text-[10px] text-muted-foreground">{s.icon} {s.name}</span>
          ))}
          {selectedSites.length > 5 && (
            <span className="glass rounded-full px-2.5 py-1 text-[10px] text-muted-foreground">+{selectedSites.length - 5}</span>
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
        <>
          <div className="flex items-center gap-6 mt-6">
            <button onClick={() => setIsPaused(p => !p)}
              className="w-16 h-16 rounded-full gradient-primary glow-neon flex items-center justify-center active:scale-95 transition-transform">
              {isPaused ? <Play className="w-7 h-7 text-primary-foreground ml-0.5" /> : <Pause className="w-7 h-7 text-primary-foreground" />}
            </button>
          </div>

          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setShowBreakDialog(true)}
            className="mt-8 px-6 py-3 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform">
            <Unlock className="w-4 h-4" />
            Break Focus (₹{penaltyAmount})
          </motion.button>
        </>
      )}

      {/* Test Block Section */}
      {isFocusActive && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 w-full max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Test Blocking</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Try opening these sites — blocked ones will be intercepted</p>
          <div className="space-y-2">
            {testSites.map(site => {
              const isBlocked = selectedSites.some(s => s.id === site.id);
              return (
                <motion.button key={site.id} whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!tryOpenSite(site)) {
                      window.open(`https://${site.domain}`, '_blank');
                    }
                  }}
                  className={`w-full rounded-xl p-3 flex items-center justify-between active:scale-[0.98] transition-transform ${
                    isBlocked ? 'glass border border-destructive/30' : 'glass'
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{site.icon}</span>
                    <div className="text-left">
                      <span className="text-sm font-medium text-foreground">{site.name}</span>
                      <span className="text-[10px] text-muted-foreground block">{site.domain}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isBlocked ? (
                      <span className="text-[10px] text-destructive font-semibold px-2 py-0.5 rounded-full bg-destructive/10">BLOCKED</span>
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <StartFocusModal open={showSetup} onClose={() => setShowSetup(false)} onStart={handleStartSession} />
      <BreakFocusDialog open={showBreakDialog} onOpenChange={setShowBreakDialog} penalty={penaltyAmount} onConfirm={handleBreak} />
      <SessionCompleteModal open={showComplete} onClose={() => setShowComplete(false)} duration={completedDuration} reward={50} />
    </div>
  );
}
