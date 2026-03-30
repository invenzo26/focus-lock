import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, Zap } from 'lucide-react';
import { useFocus, POPULAR_APPS, BlockedApp } from '@/contexts/FocusContext';
import { Input } from '@/components/ui/input';

const DURATIONS = [15, 25, 45, 60];
const PENALTIES = [10, 20, 50, 100];

interface Props {
  open: boolean;
  onClose: () => void;
  onStart: (duration: number, apps: BlockedApp[], penalty: number) => void;
}

export function StartFocusModal({ open, onClose, onStart }: Props) {
  const { savedBlockList } = useFocus();
  const [step, setStep] = useState<'apps' | 'config'>('apps');
  const [selectedApps, setSelectedApps] = useState<BlockedApp[]>(
    savedBlockList.length > 0 ? savedBlockList : []
  );
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [penalty, setPenalty] = useState(20);

  const toggleApp = (app: BlockedApp) => {
    setSelectedApps(prev =>
      prev.some(a => a.packageName === app.packageName)
        ? prev.filter(a => a.packageName !== app.packageName)
        : [...prev, app]
    );
  };

  const handleContinue = () => {
    if (step === 'apps') {
      if (selectedApps.length === 0) return;
      setStep('config');
    } else {
      const d = isCustomDuration ? Math.min(180, Math.max(1, parseInt(customDuration) || 25)) : duration;
      onStart(d, selectedApps, penalty);
      setStep('apps');
    }
  };

  const handleClose = () => { setStep('apps'); onClose(); };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-xl overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {step === 'apps' ? 'Select Apps to Block' : 'Configure Session'}
            </h2>
            <button onClick={handleClose} className="text-muted-foreground p-1">
              <X className="w-6 h-6" />
            </button>
          </div>

          {step === 'apps' ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Choose which apps to block during your focus session
              </p>
              <div className="space-y-2 mb-6">
                {POPULAR_APPS.map(app => {
                  const sel = selectedApps.some(a => a.packageName === app.packageName);
                  return (
                    <motion.button key={app.packageName} whileTap={{ scale: 0.97 }}
                      onClick={() => toggleApp(app)}
                      className="w-full glass rounded-xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{app.icon}</span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-foreground block">{app.appName}</span>
                          <span className="text-[10px] text-muted-foreground">{app.packageName}</span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                        sel ? 'gradient-primary' : 'border border-muted-foreground/30'
                      }`}>
                        {sel && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Focus Duration
              </p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => { setDuration(d); setIsCustomDuration(false); }}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                      !isCustomDuration && duration === d ? 'gradient-primary text-primary-foreground glow-primary' : 'glass text-muted-foreground'
                    }`}>{d}m</button>
                ))}
              </div>
              <button onClick={() => setIsCustomDuration(true)}
                className={`w-full mb-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isCustomDuration ? 'gradient-primary text-primary-foreground glow-primary' : 'glass text-muted-foreground'
                }`}>Custom</button>
              {isCustomDuration && (
                <Input type="number" placeholder="Enter minutes (1-180)" value={customDuration}
                  onChange={e => setCustomDuration(e.target.value)}
                  className="mb-4 glass border-primary/30" min={1} max={180} />
              )}

              <p className="text-sm text-muted-foreground mb-3 mt-6">💸 Penalty Amount</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {PENALTIES.map(p => (
                  <button key={p} onClick={() => setPenalty(p)}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                      penalty === p ? 'gradient-danger text-destructive-foreground glow-danger' : 'glass text-muted-foreground'
                    }`}>₹{p}</button>
                ))}
              </div>

              <div className="glass rounded-xl p-4 mb-6 neon-border">
                <p className="text-xs text-muted-foreground mb-2">Session Summary</p>
                <div className="flex justify-between text-sm text-foreground">
                  <span>Duration</span>
                  <span className="font-bold">{isCustomDuration ? customDuration || '25' : duration} min</span>
                </div>
                <div className="flex justify-between text-sm text-foreground mt-1">
                  <span>Apps blocked</span>
                  <span className="font-bold">{selectedApps.length}</span>
                </div>
                <div className="flex justify-between text-sm text-foreground mt-1">
                  <span>Penalty</span>
                  <span className="font-bold text-destructive">₹{penalty}</span>
                </div>
                {selectedApps.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedApps.map(a => (
                      <span key={a.packageName} className="glass rounded-full px-2 py-0.5 text-[10px] text-muted-foreground">
                        {a.icon} {a.appName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue}
            disabled={step === 'apps' && selectedApps.length === 0}
            className="w-full gradient-primary text-primary-foreground font-bold py-4 rounded-2xl glow-neon flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            <Zap className="w-5 h-5" />
            {step === 'apps' ? `Continue (${selectedApps.length} selected)` : 'Start Focus Session'}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
