import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import AppBlocker from '@/plugins/AppBlockerPlugin';

/**
 * Hook to manage native app blocking via Capacitor plugin.
 * On web, it falls back to simulated blocking.
 */
export function useNativeBlocker() {
  const [isNative] = useState(() => Capacitor.isNativePlatform());
  const [accessibilityEnabled, setAccessibilityEnabled] = useState<boolean | null>(null);

  const checkAccessibility = async () => {
    if (!isNative) { setAccessibilityEnabled(true); return; }
    try {
      const { enabled } = await AppBlocker.isAccessibilityEnabled();
      setAccessibilityEnabled(enabled);
    } catch {
      setAccessibilityEnabled(false);
    }
  };

  useEffect(() => { checkAccessibility(); }, []);

  const startNativeBlocking = async (packageNames: string[]) => {
    try {
      await AppBlocker.startBlocking({ packages: packageNames });
    } catch (e) {
      console.error('[NativeBlocker] Failed to start:', e);
    }
  };

  const stopNativeBlocking = async () => {
    try {
      await AppBlocker.stopBlocking();
    } catch (e) {
      console.error('[NativeBlocker] Failed to stop:', e);
    }
  };

  const openAccessibilitySettings = async () => {
    if (isNative) {
      await AppBlocker.openAccessibilitySettings();
    }
  };

  const getInstalledApps = async () => {
    try {
      const { apps } = await AppBlocker.getInstalledApps();
      return apps;
    } catch {
      return [];
    }
  };

  return {
    isNative,
    accessibilityEnabled,
    checkAccessibility,
    startNativeBlocking,
    stopNativeBlocking,
    openAccessibilitySettings,
    getInstalledApps,
  };
}
