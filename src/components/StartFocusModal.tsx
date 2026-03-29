import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, Zap, Plus, Globe } from 'lucide-react';
import { useFocus, PREDEFINED_SITES, BlockedSite } from '@/contexts/FocusContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const DURATIONS = [15, 25, 45, 60];
const PENALTIES = [10, 20, 50, 100];

interface Props {
  open: boolean;
  onClose: () => void;
  onStart: (duration: number, sites: BlockedSite[], penalty: number) => void;
}

export function StartFocusModal({ open, onClose, onStart }: Props) {
  const { savedBlockList } = useFocus();
  const [step, setStep] = useState<'sites' | 'config'>('sites');
  const [selectedSites, setSelectedSites] = useState<BlockedSite[]>(
    savedBlockList.length > 0 ? savedBlockList : []
  );
  const [customUrl, setCustomUrl] = useState('');
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [penalty, setPenalty] = useState(20);

  const toggleSite = (site: BlockedSite) => {
    setSelectedSites(prev =>
      prev.some(s => s.id === site.id)
        ? prev.filter(s => s.id !== site.id)
        : [...prev, site]
    );
  };

  const addCustomUrl = () => {
    const url = customUrl.trim().toLowerCase()
      .replace(/^(https?:\/\/)/, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');
    if (!url || url.length < 3 || !url.includes('.')) {
      toast.error('Enter a valid domain (e.g. example.com)');
      return;
    }
    if (selectedSites.some(s => s.domain === url)) {
      toast.error('Already added');
      return;
    }
    const custom: BlockedSite = {
      id: `custom-${Date.now()}`,
      name: url,
      domain: url,
      icon: '🌐',
      isCustom: true,
    };
    setSelectedSites(prev => [...prev, custom]);
    setCustomUrl('');
    toast.success(`${url} added`);
  };

  const handleContinue = () => {
    if (step === 'sites') {
      if (selectedSites.length === 0) return;
      setStep('config');
    } else {
      const d = isCustomDuration ? Math.min(180, Math.max(1, parseInt(customDuration) || 25)) : duration;
      onStart(d, selectedSites, penalty);
      setStep('sites');
    }
  };

  const handleClose = () => { setStep('sites'); onClose(); };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-xl overflow-y-auto"
      >
        <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {step === 'sites' ? 'Block Apps & Websites' : 'Configure Session'}
            </h2>
            <button onClick={handleClose} className="text-muted-foreground p-1">
              <X className="w-6 h-6" />
            </button>
          </div>

          {step === 'sites' ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Select apps & websites to block during your focus session
              </p>

              {/* Custom URL input */}
              <div className="flex gap-2 mb-5">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Add custom site (e.g. netflix.com)"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomUrl()}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={addCustomUrl}
                  className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center glow-primary"
                >
                  <Plus className="w-5 h-5 text-primary-foreground" />
                </motion.button>
              </div>

              {/* Custom sites */}
              {selectedSites.filter(s => s.isCustom).length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Custom Sites</p>
                  <div className="space-y-2 mb-4">
                    {selectedSites.filter(s => s.isCustom).map(site => (
                      <motion.button
                        key={site.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleSite(site)}
                        className="w-full glass rounded-xl p-3.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{site.icon}</span>
                          <div className="text-left">
                            <span className="text-sm font-medium text-foreground">{site.domain}</span>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center gradient-primary">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {/* Predefined sites */}
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Popular Apps & Websites</p>
              <div className="space-y-2 mb-6">
                {PREDEFINED_SITES.map(site => {
                  const sel = selectedSites.some(s => s.id === site.id);
                  return (
                    <motion.button
                      key={site.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleSite(site)}
                      className="w-full glass rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{site.icon}</span>
                        <div className="text-left">
                          <span className="text-sm font-medium text-foreground block">{site.name}</span>
                          <span className="text-[10px] text-muted-foreground">{site.domain}</span>
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

              {/* Summary */}
              <div className="glass rounded-xl p-4 mb-6 neon-border">
                <p className="text-xs text-muted-foreground mb-2">Session Summary</p>
                <div className="flex justify-between text-sm text-foreground">
                  <span>Duration</span>
                  <span className="font-bold">{isCustomDuration ? customDuration || '25' : duration} min</span>
                </div>
                <div className="flex justify-between text-sm text-foreground mt-1">
                  <span>Sites blocked</span>
                  <span className="font-bold">{selectedSites.length}</span>
                </div>
                <div className="flex justify-between text-sm text-foreground mt-1">
                  <span>Penalty</span>
                  <span className="font-bold text-destructive">₹{penalty}</span>
                </div>
                {selectedSites.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedSites.map(s => (
                      <span key={s.id} className="glass rounded-full px-2 py-0.5 text-[10px] text-muted-foreground">
                        {s.icon} {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue}
            disabled={step === 'sites' && selectedSites.length === 0}
            className="w-full gradient-primary text-primary-foreground font-bold py-4 rounded-2xl glow-neon flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            <Zap className="w-5 h-5" />
            {step === 'sites' ? `Continue (${selectedSites.length} selected)` : 'Start Focus Session'}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
