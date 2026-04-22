import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import AppBlocker from '@/plugins/AppBlockerPlugin';
import { permLog } from '@/lib/permissionLogger';

export interface PermissionStatus {
  accessibility: boolean | null;
  usageAccess: boolean | null;
  overlay: boolean | null;
  batteryOptimization: boolean | null;
}

export function useNativeBlocker() {
  const [isNative] = useState(() => Capacitor.isNativePlatform());
  const [permissions, setPermissions] = useState<PermissionStatus>({
    accessibility: null,
    usageAccess: null,
    overlay: null,
    batteryOptimization: null,
  });

  const checkAllPermissions = useCallback(async () => {
    if (!isNative) {
      setPermissions({ accessibility: true, usageAccess: true, overlay: true, batteryOptimization: true });
      return;
    }
    try {
      const [acc, usage, overlay, battery] = await Promise.all([
        AppBlocker.isAccessibilityEnabled(),
        AppBlocker.isUsageAccessEnabled(),
        AppBlocker.isOverlayEnabled(),
        AppBlocker.isBatteryOptimizationDisabled(),
      ]);
      const next = {
        accessibility: acc.enabled,
        usageAccess: usage.enabled,
        overlay: overlay.enabled,
        batteryOptimization: battery.enabled,
      };
      setPermissions(next);
      permLog.info('check', 'checkAllPermissions ok', next);
    } catch (err) {
      permLog.error('plugin-error', 'checkAllPermissions failed', { error: String(err) });
      setPermissions({ accessibility: false, usageAccess: false, overlay: false, batteryOptimization: false });
    }
  }, [isNative]);

  const checkAccessibility = useCallback(async () => {
    if (!isNative) { setPermissions(p => ({ ...p, accessibility: true })); return; }
    try {
      const { enabled } = await AppBlocker.isAccessibilityEnabled();
      setPermissions(p => ({ ...p, accessibility: enabled }));
    } catch {
      setPermissions(p => ({ ...p, accessibility: false }));
    }
  }, [isNative]);

  useEffect(() => { checkAllPermissions(); }, [checkAllPermissions]);

  // Re-check immediately when app resumes (user returning from Settings on any OEM).
  // Some Android OEMs (Xiaomi/MIUI, Oppo/ColorOS, Vivo/FuntouchOS, Samsung/OneUI)
  // delay propagation of permission grants by ~300-1500ms. Re-check on resume + a delayed
  // retry covers all cases without forcing the user to wait for the 2s polling interval.
  useEffect(() => {
    if (!isNative) return;
    let handle: { remove: () => void } | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        checkAllPermissions();
        // Second check after OEM settles its permission DB
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => checkAllPermissions(), 1200);
      }
    }).then((h) => { handle = h; }).catch(() => {});

    return () => {
      if (timer) clearTimeout(timer);
      handle?.remove();
    };
  }, [isNative, checkAllPermissions]);

  const allPermissionsGranted = permissions.accessibility === true &&
    permissions.usageAccess === true &&
    permissions.overlay === true &&
    permissions.batteryOptimization === true;

  const startNativeBlocking = async (packageNames: string[]) => {
    if (packageNames.length === 0) {
      throw new Error('Select at least one app to block.');
    }

    if (isNative) {
      const [accessibility, usageAccess] = await Promise.all([
        AppBlocker.isAccessibilityEnabled(),
        AppBlocker.isUsageAccessEnabled(),
      ]);

      if (!accessibility.enabled) {
        throw new Error('Enable Accessibility Service before starting focus mode.');
      }

      if (!usageAccess.enabled) {
        throw new Error('Enable Usage Access before starting focus mode.');
      }
    }

    await AppBlocker.startBlocking({ packages: packageNames });

    const status = await AppBlocker.getBlockingStatus();
    const allPackagesSaved = packageNames.every((pkg) => status.packages.includes(pkg));

    if (!status.active || !allPackagesSaved) {
      throw new Error('Native blocker did not start correctly.');
    }

    return true;
  };

  const stopNativeBlocking = async () => {
    await AppBlocker.stopBlocking();

    const status = await AppBlocker.getBlockingStatus();
    if (status.active) {
      throw new Error('Native blocker did not stop correctly.');
    }

    return true;
  };

  const openAccessibilitySettings = async () => { if (isNative) await AppBlocker.openAccessibilitySettings(); };
  const openUsageAccessSettings = async () => { if (isNative) await AppBlocker.openUsageAccessSettings(); };
  const openOverlaySettings = async () => { if (isNative) await AppBlocker.openOverlaySettings(); };
  const openBatteryOptimizationSettings = async () => { if (isNative) await AppBlocker.openBatteryOptimizationSettings(); };
  const openAutoStartSettings = async () => { if (isNative) await AppBlocker.openAutoStartSettings(); };

  const getInstalledApps = async () => {
    try { const { apps } = await AppBlocker.getInstalledApps(); return apps; } catch { return []; }
  };

  return {
    isNative,
    permissions,
    allPermissionsGranted,
    accessibilityEnabled: permissions.accessibility,
    checkAccessibility,
    checkAllPermissions,
    startNativeBlocking,
    stopNativeBlocking,
    openAccessibilitySettings,
    openUsageAccessSettings,
    openOverlaySettings,
    openBatteryOptimizationSettings,
    openAutoStartSettings,
    getInstalledApps,
  };
}
