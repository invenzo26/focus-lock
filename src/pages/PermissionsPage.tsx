import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, ExternalLink, Loader2 } from 'lucide-react';
import { useNativeBlocker } from '@/hooks/useNativeBlocker';

export default function PermissionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isNative, accessibilityEnabled, checkAccessibility, openAccessibilitySettings } = useNativeBlocker();
  const [checking, setChecking] = useState(false);

  // Poll permission status every 2s when page is open
  useEffect(() => {
    if (!isNative) return;
    const interval = setInterval(() => {
      checkAccessibility();
    }, 2000);
    return () => clearInterval(interval);
  }, [isNative, checkAccessibility]);

  // Auto-redirect once permissions are granted
  useEffect(() => {
    if (accessibilityEnabled) {
      const returnTo = (location.state as any)?.returnTo || '/';
      const timer = setTimeout(() => navigate(returnTo, { replace: true }), 1500);
      return () => clearTimeout(timer);
    }
  }, [accessibilityEnabled, navigate, location.state]);

  const handleCheck = async () => {
    setChecking(true);
    await checkAccessibility();
    setChecking(false);
  };

  // On web, just redirect home
  if (!isNative) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <ShieldCheck className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Permissions Ready</h1>
          <p className="text-sm text-muted-foreground">Native permissions are only required on Android devices.</p>
          <button onClick={() => navigate('/')} className="gradient-primary text-primary-foreground font-bold py-3 px-8 rounded-xl">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm w-full space-y-6 text-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="w-24 h-24 mx-auto rounded-full bg-primary/15 flex items-center justify-center"
        >
          <Shield className="w-12 h-12 text-primary" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Setup Permissions</h1>
          <p className="text-sm text-muted-foreground">FocusLock needs special permissions to block apps on your device.</p>
        </div>

        {/* Accessibility Service */}
        <div className={`glass rounded-xl p-4 text-left neon-border ${accessibilityEnabled ? 'border-green-500/30' : 'border-destructive/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Accessibility Service</h3>
            {accessibilityEnabled ? (
              <span className="text-[10px] font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">ENABLED</span>
            ) : (
              <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">REQUIRED</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Required to detect and block apps in real-time. FocusLock will monitor which app is in the foreground.
          </p>
          {!accessibilityEnabled && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={openAccessibilitySettings}
              className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Open Settings
            </motion.button>
          )}
        </div>

        {/* Status check */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleCheck} disabled={checking}
          className="w-full glass text-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
          {checking ? 'Checking...' : 'Refresh Status'}
        </motion.button>

        {accessibilityEnabled && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-semibold">All permissions granted!</span>
            </div>
            <p className="text-xs text-muted-foreground">Redirecting...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
