import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Pause, Play, X, ShieldAlert, Coins, ChevronRight, AlertTriangle } from 'lucide-react';
import { useFocus } from '@/contexts/FocusContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Always-on Active Focus Mode overlay.
 *
 * - Floats a compact, pause-safe banner whenever a focus session is active.
 * - Tapping it expands a sheet with: live timer, blocked apps, "stay strong"
 *   coaching, and a guarded multi-step Break Focus payment flow.
 * - The break flow uses 3 explicit steps (review → confirm penalty → final
 *   "I understand" tap) to remove the ambiguity users reported when paying.
 */
export function ActiveFocusOverlay() {
  const { user } = useAuth();
  const { isFocusActive, remainingTime, totalDuration, selectedApps, penaltyAmount, breakSession } = useFocus();
  const [expanded, setExpanded] = useState(false);
  const [breakStep, setBreakStep] = useState<0 | 1 | 2 | 3>(0); // 0 = closed
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || breakStep === 0) return;
    supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setBalance(data?.wallet_balance ?? 0));
  }, [user, breakStep]);

  if (!isFocusActive) return null;

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const progress = totalDuration > 0 ? 1 - remainingTime / totalDuration : 0;
  const insufficient = balance !== null && balance < penaltyAmount;

  const handleBreak = async () => {
    setBusy(true);
    const ok = await breakSession();
    setBusy(false);
    if (ok) {
      setBreakStep(0);
      setExpanded(false);
    }
  };

  return (
    <>
      {/* Floating banner — always visible while focus is active */}
      <motion.button
        layout
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        onClick={() => setExpanded(true)}
        className="fixed bottom-20 left-3 right-3 z-40 glass neon-border rounded-2xl px-4 py-2.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
      >
        <div className="relative w-9 h-9">
          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" stroke="hsl(var(--muted))" strokeWidth="3" fill="none" />
            <circle
              cx="18" cy="18" r="15"
              stroke="hsl(var(--primary))"
              strokeWidth="3" fill="none"
              strokeDasharray={2 * Math.PI * 15}
              strokeDashoffset={2 * Math.PI * 15 * (1 - progress)}
              strokeLinecap="round"
            />
          </svg>
          <Lock className="absolute inset-0 m-auto w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-semibold text-foreground">
            Focus Active · {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {selectedApps.length} apps blocked · tap to manage
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </motion.button>

      {/* Expanded sheet */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center"
            onClick={() => { setExpanded(false); setBreakStep(0); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-5 max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  Active Focus Mode
                </h2>
                <button
                  onClick={() => { setExpanded(false); setBreakStep(0); }}
                  className="p-1.5 rounded-lg hover:bg-muted"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Big timer */}
              <div className="text-center py-4">
                <p className="font-mono text-4xl font-bold text-foreground">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">remaining · pause-safe (clock-based)</p>
              </div>

              {/* Coaching */}
              <div className="glass rounded-xl p-3 mb-4 flex items-start gap-2">
                <Pause className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You can lock your phone or switch screens — the timer keeps running on the system clock.
                  Don't worry, leaving the app does <span className="text-foreground font-semibold">not</span> count
                  as breaking focus.
                </p>
              </div>

              {/* Blocked apps */}
              <div className="mb-5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Blocked apps</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedApps.map((a) => (
                    <span key={a.packageName} className="glass rounded-full px-2.5 py-1 text-[10px] text-foreground">
                      {a.icon} {a.appName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Break flow */}
              {breakStep === 0 ? (
                <button
                  onClick={() => setBreakStep(1)}
                  className="w-full py-3 rounded-xl border border-destructive/40 text-destructive font-bold flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 rotate-90" />
                  Break Focus (₹{penaltyAmount})
                </button>
              ) : (
                <BreakFocusFlow
                  step={breakStep}
                  setStep={setBreakStep}
                  penalty={penaltyAmount}
                  balance={balance}
                  insufficient={insufficient}
                  busy={busy}
                  onConfirm={handleBreak}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function BreakFocusFlow({
  step, setStep, penalty, balance, insufficient, busy, onConfirm,
}: {
  step: 1 | 2 | 3;
  setStep: (s: 0 | 1 | 2 | 3) => void;
  penalty: number;
  balance: number | null;
  insufficient: boolean;
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-destructive/40 rounded-2xl p-4 bg-destructive/5"
    >
      {/* Stepper */}
      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`flex-1 h-1 rounded-full ${n <= step ? 'bg-destructive' : 'bg-muted'}`}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">Step {step} of 3 — Break Focus</p>

      {step === 1 && (
        <>
          <h3 className="text-base font-bold text-foreground mb-2">Review the penalty</h3>
          <p className="text-xs text-muted-foreground mb-3">
            You set this session's penalty at <span className="text-foreground font-bold">₹{penalty}</span>.
            Your wallet currently has <span className="text-foreground font-bold">₹{balance ?? '…'}</span>.
          </p>
          {insufficient && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <p className="text-xs text-destructive">
                Not enough coins. Earn more by completing focus sessions.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl glass text-foreground font-semibold text-sm">
              Cancel
            </button>
            <button
              disabled={insufficient}
              onClick={() => setStep(2)}
              className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h3 className="text-base font-bold text-foreground mb-2">Confirm the deduction</h3>
          <div className="bg-muted/40 rounded-xl p-3 mb-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Penalty</span><span className="text-foreground font-mono">- ₹{penalty}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Wallet now</span><span className="text-foreground font-mono">₹{balance ?? '…'}</span></div>
            <div className="flex justify-between border-t border-border pt-1.5"><span className="text-muted-foreground">Wallet after</span><span className="text-destructive font-mono font-bold">₹{(balance ?? 0) - penalty}</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl glass text-foreground font-semibold text-sm">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
            >
              I understand
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h3 className="text-base font-bold text-foreground mb-2">Final confirmation</h3>
          <p className="text-xs text-muted-foreground mb-3 flex items-start gap-2">
            <Coins className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            Tapping below will <span className="text-destructive font-bold">deduct ₹{penalty}</span> from your wallet
            and immediately unblock all apps. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl glass text-foreground font-semibold text-sm">
              Back
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm disabled:opacity-60"
            >
              {busy ? 'Processing…' : `Pay ₹${penalty} & Break`}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}