import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNativeBlocker } from '@/hooks/useNativeBlocker';

/** Maps website domains to Android package names for native blocking */
const DOMAIN_TO_PACKAGE: Record<string, string> = {
  'instagram.com': 'com.instagram.android',
  'web.whatsapp.com': 'com.whatsapp',
  'youtube.com': 'com.google.android.youtube',
  'facebook.com': 'com.facebook.katana',
  'twitter.com': 'com.twitter.android',
  'tiktok.com': 'com.zhiliaoapp.musically',
  'snapchat.com': 'com.snapchat.android',
  'reddit.com': 'com.reddit.frontpage',
  'discord.com': 'com.discord',
  'netflix.com': 'com.netflix.mediaclient',
};

export interface BlockedSite {
  id: string;
  name: string;
  domain: string;
  icon: string;
  isCustom?: boolean;
}

export const PREDEFINED_SITES: BlockedSite[] = [
  { id: 'instagram', name: 'Instagram', domain: 'instagram.com', icon: '📸' },
  { id: 'whatsapp', name: 'WhatsApp Web', domain: 'web.whatsapp.com', icon: '💬' },
  { id: 'youtube', name: 'YouTube', domain: 'youtube.com', icon: '▶️' },
  { id: 'facebook', name: 'Facebook', domain: 'facebook.com', icon: '📘' },
  { id: 'twitter', name: 'Twitter / X', domain: 'twitter.com', icon: '✖️' },
  { id: 'tiktok', name: 'TikTok', domain: 'tiktok.com', icon: '🎵' },
  { id: 'snapchat', name: 'Snapchat', domain: 'snapchat.com', icon: '👻' },
  { id: 'reddit', name: 'Reddit', domain: 'reddit.com', icon: '🔴' },
  { id: 'discord', name: 'Discord', domain: 'discord.com', icon: '🎮' },
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', icon: '🎬' },
];

interface FocusState {
  isFocusActive: boolean;
  selectedSites: BlockedSite[];
  remainingTime: number;
  totalDuration: number;
  penaltyAmount: number;
  sessionId: string | null;
}

interface FocusContextValue extends FocusState {
  savedBlockList: BlockedSite[];
  setSavedBlockList: (sites: BlockedSite[]) => void;
  startSession: (duration: number, sites: BlockedSite[], penalty: number) => Promise<void>;
  breakSession: () => Promise<boolean>;
  completeSession: () => Promise<void>;
  tick: () => void;
  isSiteBlocked: (domain: string) => boolean;
  tryOpenSite: (site: BlockedSite) => boolean; // returns true if blocked
  blockedAttempt: BlockedSite | null;
  clearBlockedAttempt: () => void;
}

const defaultValue: FocusContextValue = {
  isFocusActive: false, selectedSites: [], remainingTime: 0, totalDuration: 0,
  penaltyAmount: 0, sessionId: null, savedBlockList: [], setSavedBlockList: () => {},
  startSession: async () => {}, breakSession: async () => false, completeSession: async () => {},
  tick: () => {}, isSiteBlocked: () => false, tryOpenSite: () => false,
  blockedAttempt: null, clearBlockedAttempt: () => {},
};

const FocusContext = createContext<FocusContextValue>(defaultValue);

export function useFocus() {
  return useContext(FocusContext);
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { startNativeBlocking, stopNativeBlocking } = useNativeBlocker();

  const [savedBlockList, setSavedBlockListState] = useState<BlockedSite[]>(() => {
    try { return JSON.parse(localStorage.getItem('focuslock_saved_sites') || '[]'); } catch { return []; }
  });

  const [focus, setFocus] = useState<FocusState>(() => {
    try {
      const saved = localStorage.getItem('focuslock_active_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isFocusActive && parsed.remainingTime > 0) return parsed;
      }
    } catch {}
    return { isFocusActive: false, selectedSites: [], remainingTime: 0, totalDuration: 0, penaltyAmount: 0, sessionId: null };
  });

  const [blockedAttempt, setBlockedAttempt] = useState<BlockedSite | null>(null);

  const setSavedBlockList = useCallback((sites: BlockedSite[]) => {
    setSavedBlockListState(sites);
    localStorage.setItem('focuslock_saved_sites', JSON.stringify(sites));
  }, []);

  useEffect(() => {
    if (focus.isFocusActive) {
      localStorage.setItem('focuslock_active_session', JSON.stringify(focus));
    } else {
      localStorage.removeItem('focuslock_active_session');
    }
  }, [focus]);

  const startSession = useCallback(async (duration: number, sites: BlockedSite[], penalty: number) => {
    if (!user) return;
    const appIds = sites.map(s => s.domain);
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({ user_id: user.id, duration_minutes: duration, penalty_amount: penalty, blocked_apps: appIds, status: 'active' })
      .select().single();
    if (error) { toast.error('Failed to start session'); return; }

    // Activate native app blocking on Android
    const packageNames = sites
      .map(s => DOMAIN_TO_PACKAGE[s.domain])
      .filter(Boolean);
    if (packageNames.length > 0) {
      await startNativeBlocking(packageNames);
    }

    setFocus({
      isFocusActive: true, selectedSites: sites,
      remainingTime: duration * 60, totalDuration: duration * 60,
      penaltyAmount: penalty, sessionId: data.id,
    });
    toast.success(`Focus started! ${sites.length} sites blocked 🔒`);
  }, [user, startNativeBlocking]);

  const breakSession = useCallback(async (): Promise<boolean> => {
    if (!user || !focus.sessionId) return false;
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', user.id).single();
    const balance = profile?.wallet_balance || 0;
    if (balance < focus.penaltyAmount) { toast.error('Insufficient balance!'); return false; }

    await supabase.from('profiles').update({ wallet_balance: balance - focus.penaltyAmount }).eq('id', user.id);
    await supabase.from('focus_sessions').update({ status: 'broken', ended_at: new Date().toISOString() }).eq('id', focus.sessionId);
    await supabase.from('payments').insert({ user_id: user.id, amount: focus.penaltyAmount, type: 'penalty', status: 'completed', session_id: focus.sessionId });

    // Stop native blocking
    await stopNativeBlocking();

    setFocus({ isFocusActive: false, selectedSites: [], remainingTime: 0, totalDuration: 0, penaltyAmount: 0, sessionId: null });
    setBlockedAttempt(null);
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
    // Stop native blocking
    await stopNativeBlocking();
    setFocus({ isFocusActive: false, selectedSites: [], remainingTime: 0, totalDuration: 0, penaltyAmount: 0, sessionId: null });
    toast.success('Session complete! +50 coins 🎉');
  }, [user, focus.sessionId, stopNativeBlocking]);

  const tick = useCallback(() => {
    setFocus(prev => ({ ...prev, remainingTime: Math.max(0, prev.remainingTime - 1) }));
  }, []);

  const isSiteBlocked = useCallback((domain: string) => {
    if (!focus.isFocusActive) return false;
    const d = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
    return focus.selectedSites.some(s => {
      const sd = s.domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
      return d.includes(sd) || sd.includes(d);
    });
  }, [focus.isFocusActive, focus.selectedSites]);

  const tryOpenSite = useCallback((site: BlockedSite): boolean => {
    if (!focus.isFocusActive) return false;
    if (isSiteBlocked(site.domain)) {
      setBlockedAttempt(site);
      return true;
    }
    return false;
  }, [focus.isFocusActive, isSiteBlocked]);

  const clearBlockedAttempt = useCallback(() => setBlockedAttempt(null), []);

  return (
    <FocusContext.Provider value={{
      ...focus, savedBlockList, setSavedBlockList, startSession, breakSession,
      completeSession, tick, isSiteBlocked, tryOpenSite, blockedAttempt, clearBlockedAttempt,
    }}>
      {children}
    </FocusContext.Provider>
  );
}
