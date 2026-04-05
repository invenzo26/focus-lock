import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'logo' | 'fade'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 1800);
    const t2 = setTimeout(onComplete, 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'fade' ? null : null}
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'fade' ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        style={{ background: 'var(--gradient-bg)' }}
      >
        {/* Glow backdrop */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--gradient-glow)' }} />

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="relative z-10 mb-6"
        >
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl" style={{ boxShadow: '0 0 60px hsl(var(--primary) / 0.4)' }}>
            <img src="/favicon-96x96.png" alt="FocusLock" className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* App name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-3xl font-extrabold text-foreground tracking-tight z-10"
        >
          Focus<span className="text-primary">Lock</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-sm text-muted-foreground mt-2 z-10"
        >
          Stay focused. Stay locked in.
        </motion.p>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex gap-1.5 mt-8 z-10"
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
