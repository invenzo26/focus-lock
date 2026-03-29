import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, Plus, Globe, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useFocus, PREDEFINED_SITES, BlockedSite } from '@/contexts/FocusContext';

export default function BlockPage() {
  const { savedBlockList, setSavedBlockList, isFocusActive, selectedSites, tryOpenSite } = useFocus();
  const [selected, setSelected] = useState<BlockedSite[]>(savedBlockList);
  const [search, setSearch] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const toggleSite = (site: BlockedSite) => {
    setSelected(prev =>
      prev.some(s => s.id === site.id)
        ? prev.filter(s => s.id !== site.id)
        : [...prev, site]
    );
  };

  const addCustomUrl = () => {
    const url = customUrl.trim().toLowerCase()
      .replace(/^(https?:\/\/)/, '').replace(/^www\./, '').replace(/\/.*$/, '');
    if (!url || url.length < 3 || !url.includes('.')) {
      toast.error('Enter a valid domain (e.g. example.com)');
      return;
    }
    if (selected.some(s => s.domain === url)) { toast.error('Already added'); return; }
    const custom: BlockedSite = { id: `custom-${Date.now()}`, name: url, domain: url, icon: '🌐', isCustom: true };
    setSelected(prev => [...prev, custom]);
    setCustomUrl('');
    toast.success(`${url} added`);
  };

  const filtered = PREDEFINED_SITES.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.domain.includes(search.toLowerCase()));

  const handleSave = () => {
    setSavedBlockList(selected);
    toast.success(`${selected.length} sites saved for blocking!`);
  };

  return (
    <div className="pb-4">
      <h1 className="text-2xl font-bold text-foreground mb-1">Block Apps & Websites</h1>
      <p className="text-sm text-muted-foreground mb-5">Select what to block during Focus Mode</p>

      {isFocusActive && (
        <div className="glass rounded-xl p-3 mb-4 neon-border">
          <p className="text-xs text-primary font-semibold">🔒 Focus active — {selectedSites.length} sites currently blocked</p>
        </div>
      )}

      {/* Custom URL input */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Add custom site (e.g. twitch.tv)"
            value={customUrl} onChange={e => setCustomUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomUrl()}
            className="w-full pl-10 pr-4 py-3 rounded-xl glass text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={addCustomUrl}
          className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search apps or websites..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl glass text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Custom sites */}
      {selected.filter(s => s.isCustom).length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Custom Sites</h3>
          <div className="space-y-2 mb-6">
            {selected.filter(s => s.isCustom).map(site => (
              <motion.button key={site.id} whileTap={{ scale: 0.97 }}
                onClick={() => toggleSite(site)}
                className="w-full glass rounded-xl p-3.5 flex items-center justify-between active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{site.icon}</span>
                  <span className="text-sm font-medium text-foreground">{site.domain}</span>
                </div>
                <div className="w-6 h-6 rounded-md flex items-center justify-center gradient-primary">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {/* Predefined */}
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Popular Apps & Websites</h3>
      <div className="space-y-2 mb-6">
        {filtered.map((site, i) => {
          const isSelected = selected.some(s => s.id === site.id);
          return (
            <motion.button key={site.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} onClick={() => toggleSite(site)}
              className="w-full glass rounded-xl p-3.5 flex items-center justify-between active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3">
                <span className="text-xl">{site.icon}</span>
                <div>
                  <span className="text-sm font-medium text-foreground block">{site.name}</span>
                  <span className="text-[10px] text-muted-foreground">{site.domain}</span>
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
      </div>

      {/* Test Block - when focus is active */}
      {isFocusActive && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider">Test Blocking (Live)</h3>
          </div>
          <div className="space-y-2">
            {selectedSites.map(site => (
              <motion.button key={site.id} whileTap={{ scale: 0.97 }}
                onClick={() => tryOpenSite(site)}
                className="w-full glass rounded-xl p-3.5 flex items-center justify-between border border-destructive/20">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{site.icon}</span>
                  <span className="text-sm font-medium text-foreground">{site.name}</span>
                </div>
                <span className="text-[10px] text-destructive font-semibold px-2 py-0.5 rounded-full bg-destructive/10">TAP TO TEST</span>
              </motion.button>
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
