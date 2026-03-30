import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNativeBlocker } from '@/hooks/useNativeBlocker';
import AppBlocker from '@/plugins/AppBlockerPlugin';

export interface BlockedApp {
  appName: string;
  packageName: string;
  icon: string;
}

export const POPULAR_APPS: BlockedApp[] = [
  { appName: 'Instagram', packageName: 'com.instagram.android', icon: '📸' },
  { appName: 'WhatsApp', packageName: 'com.whatsapp', icon: '💬' },
  { appName: 'YouTube', packageName: 'com.google.android.youtube', icon: '▶️' },
  { appName: 'Facebook', packageName: 'com.facebook.katana', icon: '📘' },
  { appName: 'Twitter / X', packageName: 'com.twitter.android', icon: '✖️' },
  { appName: 'TikTok', packageName: 'com.zhiliaoapp.musically', icon: '🎵' },
  { appName: 'Snapchat', packageName: 'com.snapchat.android', icon: '👻' },
  { appName: 'Reddit', packageName: 'com.reddit.frontpage', icon: '🔴' },
  { appName: 'Discord', packageName: 'com.discord', icon: '🎮' },
  { appName: 'Netflix', packageName: 'com.netflix.mediaclient', icon: '🎬' },
];

interface FocusState {
  isFocusActive: boolean;
  selectedApps: BlockedApp[];
  remainingTime: number;
  totalDuration: number;
  penaltyAmount: number;
  sessionId: string | null;
  /** Epoch ms when session started — used for background-safe timing */
  startedAt: number | null;
}

interface FocusContextValue extends FocusState {
  savedBlockList: BlockedApp[];
  setSavedBlockList: (apps: BlockedApp[]) => void;
  startSession: (duration: number, apps: BlockedApp[], penalty: number) => Promise<void>;
  breakSession: () => Promise<boolean>;
  completeSession: () => Promise<void>;
  tick: () => void;
}

const defaultValue: FocusContextValue = {
  isFocusActive: false, selectedApps: [], remainingTime: 0, totalDuration: 0,
  penaltyAmount: 0, sessionId: null, startedAt: null,
  savedBlockList: [], setSavedBlockList: () => {},
  startSession: async () => {}, breakSession: async () => false, completeSession: async () => {},
  tick: () => {},
};

const FocusContext = createContext<FocusContextValue>(defaultValue);

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
}

/**
 * Compute remaining seconds from a stored start time.
 * This is immune to app backgrounding — it always uses the real clock.
 */
function computeRemaining(startedAt: number | null, totalDuration: number): number {
  if (!startedAt || !totalDuration) return 0;
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, totalDuration - elapsed);
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isNative, startNativeBlocking, stopNativeBlocking } = useNativeBlocker();
  const restoringRef = useRef(false);
  const startingRef = useRef(false);

  const [savedBlockList, setSavedBlockListState] = useState<BlockedApp[]>(() => {
    try { return JSON.parse(localStorage.getItem('focuslock_saved_apps') || '[]'); } catch { return []; }
  });

  const [focus, setFocus] = useState<FocusState>(() => {
    try {
      const saved = localStorage.getItem('focuslock_active_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isFocusActive && parsed.startedAt) {
          const remaining = computeRemaining(parsed.startedAt, parsed.totalDuration);
          if (remaining > 0) return { ...parsed, remainingTime: remaining };
        }
      }
    } catch {}
    return { isFocusActive: false, selectedApps: [], remainingTime: 0, totalDuration: 0, penaltyAmount: 0, sessionId: null, startedAt: null };
  });

  const setSavedBlockList = useCallback((apps: BlockedApp[]) => {
    setSavedBlockListState(apps);
    localStorage.setItem('focuslock_saved_apps', JSON.stringify(apps));
  }, []);

  // Persist active session
  useEffect(() => {
    if (focus.isFocusActive) {
      localStorage.setItem('focuslock_active_session', JSON.stringify(focus));
    } else {
      localStorage.removeItem('focuslock_active_session');
    }
  }, [focus]);

  useEffect(() => {
    if (restoringRef.current) return;
    restoringRef.current = true;

    const restoreNativeSession = async () => {
      if (!focus.isFocusActive) return;

      const remaining = computeRemaining(focus.startedAt, focus.totalDuration);

      if (remaining <= 0) {
        try {
          await stopNativeBlocking();
        } catch {}

        try {
          await AppBlocker.clearFocusTimer();
        } catch {}

        setFocus({
          isFocusActive: false,
          selectedApps: [],
          remainingTime: 0,
          totalDuration: 0,
          penaltyAmount: 0,
          sessionId: null,
          startedAt: null,
        });
        return;
      }

      setFocus((prev) => ({ ...prev, remainingTime: remaining }));

      if (!isNative || focus.selectedApps.length === 0) return;

      try {
        await startNativeBlocking(focus.selectedApps.map((app) => app.packageName));
        if (focus.startedAt) {
          await AppBlocker.setFocusTimer({
            startTime: focus.startedAt,
            durationSeconds: focus.totalDuration,
          });
        }
      } catch (error) {
        console.error('[FocusContext] Failed to restore native blocking:', error);
        toast.error('Focus mode was restored without Android blocking, so it has been stopped for safety.');
        try {
          await stopNativeBlocking();
        } catch {}
        try {
          await AppBlocker.clearFocusTimer();
        } catch {}
        setFocus({
          isFocusActive: false,
          selectedApps: [],
          remainingTime: 0,
          totalDuration: 0,
          penaltyAmount: 0,
          sessionId: null,
          startedAt: null,
        });
      }
    };

    restoreNativeSession();
  }, [focus.isFocusActive, focus.selectedApps, focus.startedAt, focus.totalDuration, isNative, startNativeBlocking, stopNativeBlocking]);

  const startSession = useCallback(async (duration: number, apps: BlockedApp[], penalty: number) => {
    if (!user) return;
    if (startingRef.current) return;

    if (apps.length === 0) {
      toast.error('Select at least one app to block.');
      return;
    }

    startingRef.current = true;
    const packageNames = apps.map(a => a.packageName);

    try {
      await startNativeBlocking(packageNames);

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({ user_id: user.id, duration_minutes: duration, penalty_amount: penalty, blocked_apps: packageNames, status: 'active' })
        .select().single();

      if (error) {
        try {
          await stopNativeBlocking();
        } catch {}
        toast.error('Failed to start session');
        return;
      }

      const startedAt = Date.now();
      const totalDuration = duration * 60;

      try {
        await AppBlocker.setFocusTimer({ startTime: startedAt, durationSeconds: totalDuration });
      } catch (timerError) {
        console.error('[FocusContext] Failed to persist native timer:', timerError);
      }

      setFocus({
        isFocusActive: true, selectedApps: apps,
        remainingTime: totalDuration, totalDuration,
        penaltyAmount: penalty, sessionId: data.id,
        startedAt,
      });
      toast.success(`Focus started! ${apps.length} apps blocked 🔒`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enable Android app blocking.';
      toast.error(message);
      try {
        await stopNativeBlocking();
      } catch {}
    } finally {
      startingRef.current = false;
    }
  }, [user, startNativeBlocking, stopNativeBlocking]);

  const breakSession = useCallback(async (): Promise<boolean> => {
    if (!user || !focus.sessionId) return false;
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
    const balance = profile?.wallet_balance || 0;
    if (balance < focus.penaltyAmount) { toast.error('Insufficient balance!'); return false; }

    await supabase.from('profiles').update({ wallet_balance: balance - focus.penaltyAmount }).eq('id', user.id);
    await supabase.from('focus_sessions').update({ status: 'broken', ended_at: new Date().toISOString() }).eq('id', focus.sessionId);
    await supabase.from('payments').insert({ user_id: user.id, amount: focus.penaltyAmount, type: 'penalty', status: 'completed', session_id: focus.sessionId });

    await stopNativeBlocking();
    try { await AppBlocker.clearFocusTimer(); } catch {}

    setFocus({ isFocusActive: false, selectedApps: [], remainingTime: 0, totalDuration: 0, penaltyAmount: 0, sessionId: null, startedAt: null });
    toast.error(`₹${focus.penaltyAmount} deducted. Stay stronger! 💪`);
    return true;
  }, [user, focus, stopNativeBlocking]);

  const completeSession = useCallback(async () => {
    if (!user || !focus.sessionId) return;
    await supabase.from('focus_sessions').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', focus.sessionId);
    await supabase.rpc('increment_streak', { user_id_param: user.id });
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
    if (profile) {
      const reward = 50;
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance + reward }).eq('id', user.id);
      await supabase.from('payments').insert({ user_id: user.id, amount: reward, type: 'reward', status: 'completed', session_id: focus.sessionId });
    }
    await stopNativeBlocking();
    try { await AppBlocker.clearFocusTimer(); } catch {}
    setFocus({ isFocusActive: false, selectedApps: [], remainingTime: 0, totalDuration: 0, penaltyAmount: 0, sessionId: null, startedAt: null });
    toast.success('Session complete! +50 coins 🎉');
  }, [user, focus.sessionId, stopNativeBlocking]);

  /**
   * Tick uses system clock, not decrement.
   * This means coming back from background instantly shows correct time.
   */
  const tick = useCallback(() => {
    setFocus(prev => {
      if (!prev.startedAt) return prev;
      const remaining = computeRemaining(prev.startedAt, prev.totalDuration);
      return { ...prev, remainingTime: remaining };
    });
  }, []);

  return (
    <FocusContext.Provider value={{
      ...focus, savedBlockList, setSavedBlockList, startSession, breakSession,
      completeSession, tick,
    }}>
      {children}
    </FocusContext.Provider>
  );
}
