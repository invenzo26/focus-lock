import { WebPlugin } from '@capacitor/core';
import type { AppBlockerPlugin } from './AppBlockerPlugin';

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
    return { enabled: true };
  }

  async isUsageAccessEnabled(): Promise<{ enabled: boolean }> {
    return { enabled: true };
  }

  async isOverlayEnabled(): Promise<{ enabled: boolean }> {
    return { enabled: true };
  }

  async isBatteryOptimizationDisabled(): Promise<{ enabled: boolean }> {
    return { enabled: true };
  }

  async openAccessibilitySettings(): Promise<void> {
    console.log('[AppBlocker Web] Not available on web');
  }

  async openUsageAccessSettings(): Promise<void> {
    console.log('[AppBlocker Web] Not available on web');
  }

  async openOverlaySettings(): Promise<void> {
    console.log('[AppBlocker Web] Not available on web');
  }

  async openBatteryOptimizationSettings(): Promise<void> {
    console.log('[AppBlocker Web] Not available on web');
  }

  async openAutoStartSettings(): Promise<void> {
    console.log('[AppBlocker Web] Not available on web');
  }

  async getInstalledApps(): Promise<{ apps: { packageName: string; appName: string }[] }> {
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

  async setFocusTimer(options: { startTime: number; durationSeconds: number }): Promise<void> {
    localStorage.setItem('focuslock_timer', JSON.stringify(options));
  }

  async getFocusTimerRemaining(): Promise<{ remaining: number }> {
    try {
      const data = JSON.parse(localStorage.getItem('focuslock_timer') || '{}');
      if (data.startTime && data.durationSeconds) {
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        return { remaining: Math.max(0, data.durationSeconds - elapsed) };
      }
    } catch {}
    return { remaining: 0 };
  }

  async clearFocusTimer(): Promise<void> {
    localStorage.removeItem('focuslock_timer');
  }
}
