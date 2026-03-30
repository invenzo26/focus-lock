import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, Eye, Layers, BatteryCharging,
  ChevronRight, ChevronLeft, Loader2, Sparkles,
} from 'lucide-react';
import { useNativeBlocker } from '@/hooks/useNativeBlocker';

const PERMISSION_STEPS = [
  {
    key: 'accessibility' as const,
    icon: Shield,
    title: 'Accessibility Service',
    description: 'Required to detect which app is running in the foreground and block it in real-time.',
  },
  {
    key: 'usageAccess' as const,
    icon: Eye,
    title: 'Usage Access',
    description: 'Allows FocusLock to see which apps you use so it can enforce blocking.',
  },
  {
    key: 'overlay' as const,
    icon: Layers,
    title: 'Display Over Other Apps',
    description: 'Enables the blocking overlay to appear on top of restricted apps.',
  },
  {
    key: 'batteryOptimization' as const,
    icon: BatteryCharging,
    title: 'Disable Battery Optimization',
    description: 'Prevents Android from killing FocusLock in the background.',
  },
];

export default function PermissionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isNative, permissions, allPermissionsGranted, checkAllPermissions,
    openAccessibilitySettings, openUsageAccessSettings,
    openOverlaySettings, openBatteryOptimizationSettings, openAutoStartSettings,
  } = useNativeBlocker();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const hasNavigated = useRef(false);

  // Poll permissions every 2s
  useEffect(() => {
    if (!isNative) return;
    const interval = setInterval(checkAllPermissions, 2000);
    return () => clearInterval(interval);
  }, [isNative, checkAllPermissions]);

  // Auto-advance when current step is granted
  useEffect(() => {
    const step = PERMISSION_STEPS[currentStep];
    if (step && permissions[step.key] === true) {
      const timer = setTimeout(() => {
        if (currentStep < PERMISSION_STEPS.length - 1) {
          setCurrentStep(s => s + 1);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [permissions, currentStep]);

  // Navigate when all granted — use ref to prevent double-fire
  useEffect(() => {
    if (allPermissionsGranted && !hasNavigated.current) {
      setShowSuccess(true);
      hasNavigated.current = true;
      const timer = setTimeout(() => {
        const returnTo = (location.state as any)?.returnTo || '/';
        navigate(returnTo, { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [allPermissionsGranted, navigate, location.state]);

  // Web: skip straight through
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

  const grantAction = () => {
    const step = PERMISSION_STEPS[currentStep];
    switch (step.key) {
      case 'accessibility': return openAccessibilitySettings();
      case 'usageAccess': return openUsageAccessSettings();
      case 'overlay': return openOverlaySettings();
      case 'batteryOptimization': return openBatteryOptimizationSettings();
    }
  };

  const grantedCount = PERMISSION_STEPS.filter(s => permissions[s.key] === true).length;
  const step = PERMISSION_STEPS[currentStep];
  const StepIcon = step.icon;
  const isCurrentGranted = permissions[step.key] === true;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.8 }}
            className="w-24 h-24 mx-auto rounded-full bg-green-500/15 flex items-center justify-center"
          >
            <Sparkles className="w-12 h-12 text-green-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">You're All Set! 🎉</h1>
          <p className="text-sm text-muted-foreground">All permissions granted. Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Setup Permissions</h1>
        <p className="text-sm text-muted-foreground">FocusLock needs a few permissions to work properly</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {PERMISSION_STEPS.map((s, i) => (
          <div key={s.key} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
            permissions[s.key] ? 'gradient-primary' : i === currentStep ? 'bg-primary/40' : 'bg-muted'
          }`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mb-6">
        Step {currentStep + 1} of {PERMISSION_STEPS.length} • {grantedCount} granted
      </p>

      {/* Current step */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-sm"
          >
            <motion.div
              animate={isCurrentGranted ? { scale: [1, 1.1, 1] } : { scale: [1, 1.05, 1] }}
              transition={{ repeat: isCurrentGranted ? 0 : Infinity, duration: 2.5 }}
              className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center ${
                isCurrentGranted ? 'bg-green-500/15' : 'bg-primary/15'
              }`}
            >
              <StepIcon className={`w-12 h-12 ${isCurrentGranted ? 'text-green-400' : 'text-primary'}`} />
            </motion.div>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
                {isCurrentGranted && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    ✓ ENABLED
                  </motion.span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>

            {!isCurrentGranted ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={grantAction}
                className="w-full gradient-primary text-primary-foreground font-bold py-4 rounded-2xl glow-neon flex items-center justify-center gap-2 text-base"
              >
                Grant Permission
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => currentStep < PERMISSION_STEPS.length - 1 && setCurrentStep(s => s + 1)}
                className="w-full glass text-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 neon-border"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav dots */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}
          className="text-muted-foreground disabled:opacity-30">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          {PERMISSION_STEPS.map((s, i) => (
            <button key={s.key} onClick={() => setCurrentStep(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentStep ? 'bg-primary scale-125' : permissions[s.key] ? 'bg-green-400' : 'bg-muted'
              }`} />
          ))}
        </div>
        <button onClick={() => setCurrentStep(s => Math.min(PERMISSION_STEPS.length - 1, s + 1))}
          disabled={currentStep === PERMISSION_STEPS.length - 1}
          className="text-muted-foreground disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-6 text-center">
        <button onClick={openAutoStartSettings}
          className="text-xs text-muted-foreground underline underline-offset-2">
          MIUI/Xiaomi? Enable Auto-Start →
        </button>
      </div>
    </div>
  );
}
