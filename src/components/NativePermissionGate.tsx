import { useEffect, useState, useRef } from 'react';
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
  const [checked, setChecked] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const check = async () => {
      // Web: always pass through
      if (!Capacitor.isNativePlatform()) {
        setChecked(true);
        return;
      }

      // Don't check on these pages (avoids loops)
      if (location.pathname === '/permissions' || location.pathname === '/auth') {
        setChecked(true);
        return;
      }

      // Only redirect once per app session to avoid infinite loops
      if (hasRedirected.current) {
        setChecked(true);
        return;
      }

      try {
        const [acc, usage] = await Promise.all([
          AppBlocker.isAccessibilityEnabled(),
          AppBlocker.isUsageAccessEnabled(),
        ]);
        if (!acc.enabled || !usage.enabled) {
          hasRedirected.current = true;
          navigate('/permissions', { replace: true, state: { returnTo: location.pathname } });
        }
      } catch {
        // Plugin error — allow through
      }
      setChecked(true);
    };
    check();
  }, [location.pathname]);

  if (!checked) return null;
  return <>{children}</>;
}
