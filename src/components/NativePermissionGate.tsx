import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import AppBlocker from '@/plugins/AppBlockerPlugin';

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

    const check = async () => {
      if (!Capacitor.isNativePlatform()) {
        if (!cancelled) setChecked(true);
        return;
      }

      if (location.pathname === '/permissions' || location.pathname === '/auth') {
        if (!cancelled) setChecked(true);
        return;
      }

      if (!cancelled) setChecked(false);

      try {
        const [acc, usage] = await Promise.all([
          AppBlocker.isAccessibilityEnabled(),
          AppBlocker.isUsageAccessEnabled(),
        ]);

        if (cancelled) return;

        if (!acc.enabled || !usage.enabled) {
          navigate('/permissions', { replace: true, state: { returnTo: location.pathname } });
          return;
        }
      } catch {
        if (cancelled) return;
      }

      if (!cancelled) setChecked(true);
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  if (!checked) return null;
  return <>{children}</>;
}
