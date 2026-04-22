/**
 * Lightweight Android brand & version detector for permission guidance.
 *
 * Uses User-Agent + Capacitor's Device API surrogate (UA hints) to identify the
 * OEM. We don't need 100% accuracy — just enough to show the correct Settings
 * path. If unknown, we fall back to "stock Android" instructions.
 */

export type AndroidBrand =
  | 'xiaomi'   // MIUI / HyperOS
  | 'oppo'     // ColorOS
  | 'realme'   // Realme UI
  | 'vivo'     // FuntouchOS / OriginOS
  | 'samsung'  // OneUI
  | 'oneplus'  // OxygenOS
  | 'huawei'   // EMUI / HarmonyOS
  | 'honor'
  | 'motorola'
  | 'pixel'    // Stock Android
  | 'unknown';

export interface DeviceInfo {
  brand: AndroidBrand;
  brandLabel: string;
  androidVersion: number | null;
  isAndroid: boolean;
  rawUserAgent: string;
}

const BRAND_LABELS: Record<AndroidBrand, string> = {
  xiaomi: 'Xiaomi / Redmi / POCO (MIUI / HyperOS)',
  oppo: 'OPPO (ColorOS)',
  realme: 'Realme (Realme UI)',
  vivo: 'Vivo / iQOO (FuntouchOS / OriginOS)',
  samsung: 'Samsung (One UI)',
  oneplus: 'OnePlus (OxygenOS)',
  huawei: 'Huawei (EMUI / HarmonyOS)',
  honor: 'Honor (MagicOS)',
  motorola: 'Motorola (My UX)',
  pixel: 'Google Pixel (Stock Android)',
  unknown: 'Android',
};

function detectBrand(ua: string): AndroidBrand {
  const u = ua.toLowerCase();
  if (/mi |redmi|poco|xiaomi|hyperos|miui/.test(u)) return 'xiaomi';
  if (/oppo|coloros/.test(u)) return 'oppo';
  if (/realme/.test(u)) return 'realme';
  if (/vivo|iqoo|funtouch|originos/.test(u)) return 'vivo';
  if (/samsung|sm-[a-z0-9]+/.test(u)) return 'samsung';
  if (/oneplus|oxygen/.test(u)) return 'oneplus';
  if (/huawei|emui|harmonyos/.test(u)) return 'huawei';
  if (/honor/.test(u)) return 'honor';
  if (/motorola|moto /.test(u)) return 'motorola';
  if (/pixel/.test(u)) return 'pixel';
  return 'unknown';
}

function detectAndroidVersion(ua: string): number | null {
  const m = ua.match(/Android\s+(\d+)(?:\.\d+)?/i);
  return m ? parseInt(m[1], 10) : null;
}

export function getDeviceInfo(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const brand = detectBrand(ua);
  return {
    brand,
    brandLabel: BRAND_LABELS[brand],
    androidVersion: detectAndroidVersion(ua),
    isAndroid: /android/i.test(ua),
    rawUserAgent: ua,
  };
}

export interface BrandSettingsPath {
  accessibility: string[];
  usageAccess: string[];
  overlay: string[];
  battery: string[];
  autostart?: string[];
}

/**
 * Per-OEM Settings paths verified against publicly documented behavior.
 * Each entry is an ordered breadcrumb the user can follow if the in-app
 * "Open Settings" deep link doesn't land them on the right screen.
 */
export const BRAND_SETTINGS_PATHS: Record<AndroidBrand, BrandSettingsPath> = {
  xiaomi: {
    accessibility: ['Settings', 'Additional settings', 'Accessibility', 'Downloaded apps', 'FocusLock', 'Turn ON'],
    usageAccess: ['Settings', 'Apps', 'Permissions', 'Usage access', 'FocusLock', 'Permit usage access'],
    overlay: ['Settings', 'Apps', 'Permissions', 'Other permissions', 'FocusLock', 'Display pop-up windows'],
    battery: ['Settings', 'Battery', 'App battery saver', 'FocusLock', 'No restrictions'],
    autostart: ['Settings', 'Apps', 'Manage apps', 'FocusLock', 'Autostart → Enable'],
  },
  oppo: {
    accessibility: ['Settings', 'Additional settings', 'Accessibility', 'Downloaded apps', 'FocusLock', 'Enable'],
    usageAccess: ['Settings', 'Privacy', 'Permission manager', 'Usage access', 'FocusLock', 'Allow'],
    overlay: ['Settings', 'Privacy', 'Floating window', 'FocusLock', 'Enable'],
    battery: ['Settings', 'Battery', 'High background power consumption', 'FocusLock', 'Allow'],
    autostart: ['Settings', 'Battery', 'Background app management', 'FocusLock', 'Enable'],
  },
  realme: {
    accessibility: ['Settings', 'Additional settings', 'Accessibility', 'Installed services', 'FocusLock', 'Enable'],
    usageAccess: ['Settings', 'Apps', 'App permissions', 'Usage access', 'FocusLock', 'Allow'],
    overlay: ['Settings', 'Apps', 'Special access', 'Display over other apps', 'FocusLock'],
    battery: ['Settings', 'Battery', 'App battery management', 'FocusLock', 'Allow background activity'],
    autostart: ['Settings', 'App management', 'App list', 'FocusLock', 'Allow auto-launch'],
  },
  vivo: {
    accessibility: ['Settings', 'More settings', 'Accessibility', 'Installed services', 'FocusLock', 'Enable'],
    usageAccess: ['Settings', 'More settings', 'Permission manager', 'Apps', 'FocusLock', 'App usage records'],
    overlay: ['Settings', 'More settings', 'Permission manager', 'Permissions', 'Display on top', 'FocusLock'],
    battery: ['Settings', 'Battery', 'High background power usage', 'FocusLock'],
    autostart: ['i Manager / Phone Manager', 'App manager', 'Autostart manager', 'FocusLock'],
  },
  samsung: {
    accessibility: ['Settings', 'Accessibility', 'Installed apps', 'FocusLock', 'Toggle ON'],
    usageAccess: ['Settings', 'Apps', '⋮ menu', 'Special access', 'Usage data access', 'FocusLock', 'Allow'],
    overlay: ['Settings', 'Apps', '⋮ menu', 'Special access', 'Appear on top', 'FocusLock'],
    battery: ['Settings', 'Apps', 'FocusLock', 'Battery', 'Unrestricted'],
  },
  oneplus: {
    accessibility: ['Settings', 'Additional settings', 'Accessibility', 'Downloaded services', 'FocusLock', 'Enable'],
    usageAccess: ['Settings', 'Privacy', 'Permission manager', 'Usage access', 'FocusLock', 'Allow'],
    overlay: ['Settings', 'Apps', 'App management', 'FocusLock', 'Display over other apps'],
    battery: ['Settings', 'Battery', 'Battery optimization', 'FocusLock', "Don't optimize"],
    autostart: ['Settings', 'Apps', 'App management', 'FocusLock', 'Auto-launch'],
  },
  huawei: {
    accessibility: ['Settings', 'Accessibility features', 'Accessibility', 'FocusLock', 'Enable'],
    usageAccess: ['Settings', 'Apps', 'Permissions', 'Permissions', 'Usage access', 'FocusLock'],
    overlay: ['Settings', 'Apps', 'Permissions', 'Permissions', 'Display over other apps', 'FocusLock'],
    battery: ['Settings', 'Battery', 'App launch', 'FocusLock', 'Manage manually → all ON'],
  },
  honor: {
    accessibility: ['Settings', 'Accessibility features', 'Accessibility', 'FocusLock', 'Enable'],
    usageAccess: ['Settings', 'Apps', 'Permissions', 'Usage access', 'FocusLock'],
    overlay: ['Settings', 'Apps', 'Permissions', 'Display over other apps', 'FocusLock'],
    battery: ['Settings', 'Battery', 'Launch', 'FocusLock', 'Manual → all ON'],
  },
  motorola: {
    accessibility: ['Settings', 'Accessibility', 'Downloaded apps', 'FocusLock', 'Enable'],
    usageAccess: ['Settings', 'Apps', 'Special app access', 'Usage access', 'FocusLock'],
    overlay: ['Settings', 'Apps', 'Special app access', 'Display over other apps', 'FocusLock'],
    battery: ['Settings', 'Battery', 'Battery optimization', 'FocusLock', "Don't optimize"],
  },
  pixel: {
    accessibility: ['Settings', 'Accessibility', 'Installed apps', 'FocusLock', 'Toggle ON'],
    usageAccess: ['Settings', 'Apps', 'Special app access', 'Usage access', 'FocusLock', 'Allow'],
    overlay: ['Settings', 'Apps', 'Special app access', 'Display over other apps', 'FocusLock'],
    battery: ['Settings', 'Apps', 'FocusLock', 'App battery usage', 'Unrestricted'],
  },
  unknown: {
    accessibility: ['Settings', 'Accessibility', 'Installed services', 'FocusLock', 'Enable'],
    usageAccess: ['Settings', 'Apps', 'Special access', 'Usage access', 'FocusLock', 'Allow'],
    overlay: ['Settings', 'Apps', 'Special access', 'Display over other apps', 'FocusLock'],
    battery: ['Settings', 'Battery', 'Battery optimization', 'FocusLock', "Don't optimize"],
  },
};