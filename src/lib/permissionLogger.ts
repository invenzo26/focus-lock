/**
 * Permission Flow Event Logger
 *
 * Records permission check attempts, navigation outcomes, plugin errors and
 * device metadata to localStorage. Useful for debugging permission propagation
 * differences across Android OEMs (Xiaomi/MIUI, Oppo/ColorOS, Samsung/OneUI,
 * Vivo/FuntouchOS, OnePlus/OxygenOS, Realme, etc.).
 *
 * Logs are kept locally (max 200 entries, ring-buffer) and can be exported
 * from the Diagnostics screen.
 */

const STORAGE_KEY = 'focuslock_permission_log';
const MAX_ENTRIES = 200;

export type PermissionLogLevel = 'info' | 'warn' | 'error' | 'success';
export type PermissionLogCategory =
  | 'check'
  | 'navigation'
  | 'plugin-error'
  | 'settings-open'
  | 'grant'
  | 'diagnostic';

export interface PermissionLogEntry {
  ts: number;
  level: PermissionLogLevel;
  category: PermissionLogCategory;
  message: string;
  data?: Record<string, unknown>;
}

function readAll(): PermissionLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PermissionLogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: PermissionLogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // localStorage full or unavailable — silently drop
  }
}

export const permLog = {
  log(
    level: PermissionLogLevel,
    category: PermissionLogCategory,
    message: string,
    data?: Record<string, unknown>,
  ) {
    const entry: PermissionLogEntry = { ts: Date.now(), level, category, message, data };
    const all = readAll();
    all.push(entry);
    writeAll(all);
    // Mirror to console for live debugging via `adb logcat | grep chromium`
    const tag = `[PermLog/${category}]`;
    if (level === 'error') console.error(tag, message, data);
    else if (level === 'warn') console.warn(tag, message, data);
    else console.log(tag, message, data);
  },
  info(category: PermissionLogCategory, message: string, data?: Record<string, unknown>) {
    this.log('info', category, message, data);
  },
  warn(category: PermissionLogCategory, message: string, data?: Record<string, unknown>) {
    this.log('warn', category, message, data);
  },
  error(category: PermissionLogCategory, message: string, data?: Record<string, unknown>) {
    this.log('error', category, message, data);
  },
  success(category: PermissionLogCategory, message: string, data?: Record<string, unknown>) {
    this.log('success', category, message, data);
  },
  getAll(): PermissionLogEntry[] {
    return readAll();
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
  exportAsText(): string {
    return readAll()
      .map((e) => {
        const time = new Date(e.ts).toISOString();
        const data = e.data ? ` ${JSON.stringify(e.data)}` : '';
        return `${time} [${e.level.toUpperCase()}] (${e.category}) ${e.message}${data}`;
      })
      .join('\n');
  },
};