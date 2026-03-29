import { registerPlugin } from '@capacitor/core';

export interface AppBlockerPlugin {
  /** Start blocking the given package names */
  startBlocking(options: { packages: string[] }): Promise<void>;
  /** Stop blocking all apps */
  stopBlocking(): Promise<void>;
  /** Check if accessibility service is enabled */
  isAccessibilityEnabled(): Promise<{ enabled: boolean }>;
  /** Open accessibility settings so user can enable the service */
  openAccessibilitySettings(): Promise<void>;
  /** Get list of installed apps */
  getInstalledApps(): Promise<{ apps: { packageName: string; appName: string }[] }>;
}

const AppBlocker = registerPlugin<AppBlockerPlugin>('AppBlocker', {
  web: () => import('./AppBlockerWeb').then(m => new m.AppBlockerWeb()),
});

export default AppBlocker;
