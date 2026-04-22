import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import AppBlocker from '@/plugins/AppBlockerPlugin';
import { permLog } from '@/lib/permissionLogger';

/**
 * Checks critical permissions on native launch.
 * Redirects to /permissions if Accessibility or Usage Access are missing.
 * Does NOT block on web — always passes through.
 */
export function NativePermissionGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(!Capacitor.isNativePlatform());

  useEffect(() => {
    let cancelled = false;
    let resumeHandle: { remove: () => void } | null = null;

    // Robust check: poll up to 3 times with backoff before redirecting, because some
    // Android OEMs (Xiaomi, Oppo, Vivo, Samsung) take 300-1500ms to propagate a freshly
    // granted permission after the user returns from system Settings.
    const queryOnce = async () => {
      try {
        const [acc, usage] = await Promise.all([
          AppBlocker.isAccessibilityEnabled(),
          AppBlocker.isUsageAccessEnabled(),
        ]);
          permLog.info('check', 'gate queryOnce', { acc: acc.enabled, usage: usage.enabled });
        return acc.enabled && usage.enabled;
        } catch (err) {
          permLog.error('plugin-error', 'gate queryOnce threw', { error: String(err) });
        // Plugin error → treat as unknown; let the gate pass to avoid an infinite redirect
        // loop on devices where the plugin call fails transiently (rare WebView quirks).
        return true;
      }
    };

    const check = async () => {
      if (!Capacitor.isNativePlatform()) {
        if (!cancelled) setChecked(true);
        return;
      }

      if (location.pathname === '/permissions' || location.pathname === '/auth') {
        if (!cancelled) setChecked(true);
        return;
      }

      // Skip permission check if we just came from the permissions page (grace period)
      const graceUntil = sessionStorage.getItem('permissions_grace_until');
      if (graceUntil && Date.now() < parseInt(graceUntil, 10)) {
        if (!cancelled) setChecked(true);
        return;
      }

      if (!cancelled) setChecked(false);

      // Try up to 3 attempts with backoff to absorb OEM propagation delay.
      const delays = [0, 600, 1200];
      for (const d of delays) {
        if (d > 0) await new Promise((r) => setTimeout(r, d));
        if (cancelled) return;
        const ok = await queryOnce();
        if (cancelled) return;
        if (ok) {
          setChecked(true);
          return;
        }
      }

      if (cancelled) return;
      permLog.warn('navigation', 'Gate redirecting to /permissions', { from: location.pathname });
      navigate('/permissions', { replace: true, state: { returnTo: location.pathname } });
    };

    check();

    // Re-run the check when the app resumes (e.g. returning from system Settings),
    // so users are not stuck on a stale "redirect loading" state.
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) check();
    }).then((h) => { resumeHandle = h; }).catch(() => {});

    return () => {
      cancelled = true;
      resumeHandle?.remove();
    };
  }, [location.pathname, navigate]);

  if (!checked) return null;
  return <>{children}</>;
}
