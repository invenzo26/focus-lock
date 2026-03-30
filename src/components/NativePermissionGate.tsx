import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import AppBlocker from '@/plugins/AppBlockerPlugin';

/**
 * Checks all critical permissions on native launch.
 * Redirects to /permissions if any are missing.
 */
export function NativePermissionGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!Capacitor.isNativePlatform()) {
        setChecked(true);
        return;
      }

      // Skip redirect if already on permissions or auth
      if (location.pathname === '/permissions' || location.pathname === '/auth') {
        setChecked(true);
        return;
      }

      try {
        const [acc, usage] = await Promise.all([
          AppBlocker.isAccessibilityEnabled(),
          AppBlocker.isUsageAccessEnabled(),
        ]);
        if (!acc.enabled || !usage.enabled) {
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
