import { registerPlugin } from '@capacitor/core';

export interface AppBlockerPlugin {
  startBlocking(options: { packages: string[] }): Promise<void>;
  stopBlocking(): Promise<void>;
  isAccessibilityEnabled(): Promise<{ enabled: boolean }>;
  isUsageAccessEnabled(): Promise<{ enabled: boolean }>;
  isOverlayEnabled(): Promise<{ enabled: boolean }>;
  isBatteryOptimizationDisabled(): Promise<{ enabled: boolean }>;
  openAccessibilitySettings(): Promise<void>;
  openUsageAccessSettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  openBatteryOptimizationSettings(): Promise<void>;
  openAutoStartSettings(): Promise<void>;
  getInstalledApps(): Promise<{ apps: { packageName: string; appName: string }[] }>;
  /** Store focus start time natively for background-safe timer */
  setFocusTimer(options: { startTime: number; durationSeconds: number }): Promise<void>;
  /** Get remaining seconds from native clock */
  getFocusTimerRemaining(): Promise<{ remaining: number }>;
  /** Clear native timer */
  clearFocusTimer(): Promise<void>;
}

const AppBlocker = registerPlugin<AppBlockerPlugin>('AppBlocker', {
  web: () => import('./AppBlockerWeb').then(m => new m.AppBlockerWeb()),
});

export default AppBlocker;
