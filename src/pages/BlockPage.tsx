import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, ShieldAlert, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useFocus, POPULAR_APPS, BlockedApp } from '@/contexts/FocusContext';
import { useNativeBlocker } from '@/hooks/useNativeBlocker';

/** Assign an icon based on known package names, fallback to 📱 */
const APP_ICONS: Record<string, string> = {
  'com.instagram.android': '📸',
  'com.whatsapp': '💬',
  'com.google.android.youtube': '▶️',
  'com.facebook.katana': '📘',
  'com.twitter.android': '✖️',
  'com.zhiliaoapp.musically': '🎵',
  'com.snapchat.android': '👻',
  'com.reddit.frontpage': '🔴',
  'com.discord': '🎮',
  'com.netflix.mediaclient': '🎬',
  'com.spotify.music': '🎧',
  'com.google.android.apps.maps': '🗺️',
  'com.amazon.mShop.android.shopping': '🛒',
  'com.linkedin.android': '💼',
  'com.pinterest': '📌',
};

export default function BlockPage() {
  const { savedBlockList, setSavedBlockList, isFocusActive, selectedApps } = useFocus();
  const { getInstalledApps, isNative } = useNativeBlocker();
  const [selected, setSelected] = useState<BlockedApp[]>(savedBlockList);
  const [search, setSearch] = useState('');
  const [installedApps, setInstalledApps] = useState<BlockedApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      try {
        const apps = await getInstalledApps();
        const mapped: BlockedApp[] = apps.map(a => ({
          appName: a.appName,
          packageName: a.packageName,
          icon: APP_ICONS[a.packageName] || '📱',
        }));
        // Merge with popular apps to avoid duplicates, installed apps first
        const packageSet = new Set(mapped.map(a => a.packageName));
        const extra = POPULAR_APPS.filter(a => !packageSet.has(a.packageName));
        setInstalledApps([...mapped, ...extra]);
      } catch {
        setInstalledApps(POPULAR_APPS);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const toggleApp = (app: BlockedApp) => {
    setSelected(prev =>
      prev.some(a => a.packageName === app.packageName)
        ? prev.filter(a => a.packageName !== app.packageName)
        : [...prev, app]
    );
  };

  const filtered = installedApps.filter(a =>
    a.appName.toLowerCase().includes(search.toLowerCase()) ||
    a.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    setSavedBlockList(selected);
    toast.success(`${selected.length} apps saved for blocking!`);
  };

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold text-foreground mb-1">Block Apps</h1>
      <p className="text-sm text-muted-foreground mb-5">
        {isNative ? 'Showing installed apps from your device' : 'Select apps to block during Focus Mode'}
      </p>

      {isFocusActive && (
        <div className="glass rounded-xl p-3 mb-4 neon-border">
          <p className="text-xs text-primary font-semibold">🔒 Focus active — {selectedApps.length} apps currently blocked</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search apps..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl glass text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading apps...</p>
        </div>
      ) : (
        <>
          {/* App list */}
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isNative ? 'Installed Apps' : 'Available Apps'} ({filtered.length})
            </h3>
          </div>
          <div className="space-y-2 mb-6">
            {filtered.map((app, i) => {
              const isSelected = selected.some(a => a.packageName === app.packageName);
              return (
                <motion.button key={app.packageName} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }} onClick={() => toggleApp(app)}
                  className="w-full glass rounded-xl p-3.5 flex items-center justify-between active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{app.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-foreground block">{app.appName}</span>
                      <span className="text-[10px] text-muted-foreground">{app.packageName}</span>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    isSelected ? 'gradient-primary' : 'border border-muted-foreground/30'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                </motion.button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No apps found matching "{search}"</p>
            )}
          </div>
        </>
      )}

      {/* Blocked apps during focus */}
      {isFocusActive && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider">Currently Blocked</h3>
          </div>
          <div className="space-y-2">
            {selectedApps.map(app => (
              <div key={app.packageName}
                className="w-full glass rounded-xl p-3.5 flex items-center justify-between border border-destructive/20">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{app.icon}</span>
                  <span className="text-sm font-medium text-foreground">{app.appName}</span>
                </div>
                <span className="text-[10px] text-destructive font-semibold px-2 py-0.5 rounded-full bg-destructive/10">BLOCKED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
        className="w-full gradient-primary text-primary-foreground font-bold py-4 rounded-2xl glow-neon">
        Save Blocking ({selected.length} selected)
      </motion.button>
    </div>
  );
}
