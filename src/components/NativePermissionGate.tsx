import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import AppBlocker from '@/plugins/AppBlockerPlugin';

/**
 * Component that checks native permissions on app launch.
 * If Accessibility Service is not enabled on Android, redirects to /permissions.
 */
export function NativePermissionGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      // Only check on native Android
      if (!Capacitor.isNativePlatform()) {
        setChecked(true);
        return;
      }

      // Don't redirect if already on permissions or auth page
      if (location.pathname === '/permissions' || location.pathname === '/auth') {
        setChecked(true);
        return;
      }

      try {
        const { enabled } = await AppBlocker.isAccessibilityEnabled();
        if (!enabled) {
          navigate('/permissions', { replace: true, state: { returnTo: location.pathname } });
        }
      } catch {
        // If plugin fails, allow through
      }
      setChecked(true);
    };
    check();
  }, [location.pathname]);

  if (!checked) return null;
  return <>{children}</>;
}
