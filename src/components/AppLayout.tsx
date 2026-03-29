import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BottomNav } from './BottomNav';
import { FocusBanner } from './FocusBanner';
import { BlockedScreen } from './BlockedScreen';

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background relative max-w-lg mx-auto">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--gradient-glow)' }} />
      <main className="px-4 pt-4 safe-bottom relative z-10">
        <FocusBanner />
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {children}
        </motion.div>
      </main>
      <BottomNav />
      <BlockedScreen />
    </div>
  );
}
