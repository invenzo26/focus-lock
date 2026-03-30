import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNativeBlocker } from '@/hooks/useNativeBlocker';

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
  penaltyAmount: 0, sessionId: null, savedBlockList: [], setSavedBlockList: () => {},
  startSession: async () => {}, breakSession: async () => false, completeSession: async () => {},
  tick: () => {},
};

const FocusContext = createContext<FocusContextValue>(defaultValue);

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { startNativeBlocking, stopNativeBlocking } = useNativeBlocker();

  const [savedBlockList, setSavedBlockListState] = useState<BlockedApp[]>(() => {
    try { return JSON.parse(localStorage.getItem('focuslock_saved_apps') || '[]'); } catch { return []; }
  });

  const [focus, setFocus] = useState<FocusState>(() => {
    try {
      const saved = localStorage.getItem('focuslock_active_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isFocusActive && parsed.remainingTime > 0) return parsed;
      }
    } catch {}
    return { isFocusActive: false, selectedApps: [], remainingTime: 0, totalDuration: 0, penaltyAmount: 0, sessionId: null };
  });

  const setSavedBlockList = useCallback((apps: BlockedApp[]) => {
    setSavedBlockListState(apps);
    localStorage.setItem('focuslock_saved_apps', JSON.stringify(apps));
  }, []);

  useEffect(() => {
    if (focus.isFocusActive) {
      localStorage.setItem('focuslock_active_session', JSON.stringify(focus));
    } else {
      localStorage.removeItem('focuslock_active_session');
    }
  }, [focus]);

  const startSession = useCallback(async (duration: number, apps: BlockedApp[], penalty: number) => {
    if (!user) return;
    const packageNames = apps.map(a => a.packageName);
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({ user_id: user.id, duration_minutes: duration, penalty_amount: penalty, blocked_apps: packageNames, status: 'active' })
      .select().single();
    if (error) { toast.error('Failed to start session'); return; }

    if (packageNames.length > 0) {
      await startNativeBlocking(packageNames);
    }

    setFocus({
      isFocusActive: true, selectedApps: apps,
      remainingTime: duration * 60, totalDuration: duration * 60,
      penaltyAmount: penalty, sessionId: data.id,
    });
    toast.success(`Focus started! ${apps.length} apps blocked 🔒`);
  }, [user, startNativeBlocking]);

  const breakSession = useCallback(async (): Promise<boolean> => {
    if (!user || !focus.sessionId) return false;
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
    const balance = profile?.wallet_balance || 0;
    if (balance < focus.penaltyAmount) { toast.error('Insufficient balance!'); return false; }

    await supabase.from('profiles').update({ wallet_balance: balance - focus.penaltyAmount }).eq('id', user.id);
    await supabase.from('focus_sessions').update({ status: 'broken', ended_at: new Date().toISOString() }).eq('id', focus.sessionId);
    await supabase.from('payments').insert({ user_id: user.id, amount: focus.penaltyAmount, type: 'penalty', status: 'completed', session_id: focus.sessionId });

    await stopNativeBlocking();

    setFocus({ isFocusActive: false, selectedApps: [], remainingTime: 0, totalDuration: 0, penaltyAmount: 0, sessionId: null });
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
    setFocus({ isFocusActive: false, selectedApps: [], remainingTime: 0, totalDuration: 0, penaltyAmount: 0, sessionId: null });
    toast.success('Session complete! +50 coins 🎉');
  }, [user, focus.sessionId, stopNativeBlocking]);

  const tick = useCallback(() => {
    setFocus(prev => ({ ...prev, remainingTime: Math.max(0, prev.remainingTime - 1) }));
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
