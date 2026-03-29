import { WebPlugin } from '@capacitor/core';
import type { AppBlockerPlugin } from './AppBlockerPlugin';

/**
 * Web fallback — simulates blocking behavior in the browser.
 * Real blocking only works on Android via Accessibility Service.
 */
export class AppBlockerWeb extends WebPlugin implements AppBlockerPlugin {
  async startBlocking(options: { packages: string[] }): Promise<void> {
    console.log('[AppBlocker Web] Simulated blocking:', options.packages);
    localStorage.setItem('focuslock_native_blocked', JSON.stringify(options.packages));
  }

  async stopBlocking(): Promise<void> {
    console.log('[AppBlocker Web] Simulated stop blocking');
    localStorage.removeItem('focuslock_native_blocked');
  }

  async isAccessibilityEnabled(): Promise<{ enabled: boolean }> {
    // On web, we consider it always "enabled" since we use simulated blocking
    return { enabled: true };
  }

  async openAccessibilitySettings(): Promise<void> {
    console.log('[AppBlocker Web] Accessibility settings not available on web');
  }

  async getInstalledApps(): Promise<{ apps: { packageName: string; appName: string }[] }> {
    // Return predefined list on web
    return {
      apps: [
        { packageName: 'com.instagram.android', appName: 'Instagram' },
        { packageName: 'com.whatsapp', appName: 'WhatsApp' },
        { packageName: 'com.google.android.youtube', appName: 'YouTube' },
        { packageName: 'com.facebook.katana', appName: 'Facebook' },
        { packageName: 'com.twitter.android', appName: 'Twitter / X' },
        { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok' },
        { packageName: 'com.snapchat.android', appName: 'Snapchat' },
        { packageName: 'com.reddit.frontpage', appName: 'Reddit' },
        { packageName: 'com.discord', appName: 'Discord' },
        { packageName: 'com.netflix.mediaclient', appName: 'Netflix' },
      ],
    };
  }
}
