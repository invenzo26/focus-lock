import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Smartphone, ExternalLink } from 'lucide-react';
import { getDeviceInfo, BRAND_SETTINGS_PATHS, AndroidBrand } from '@/lib/deviceInfo';

const BRAND_OPTIONS: AndroidBrand[] = [
  'pixel', 'samsung', 'xiaomi', 'oppo', 'realme', 'vivo',
  'oneplus', 'huawei', 'honor', 'motorola', 'unknown',
];

interface Props {
  /** Which permission breadcrumb to show. */
  focusOn?: 'accessibility' | 'usageAccess' | 'overlay' | 'battery' | 'all';
}

/**
 * In-app step-by-step permission guide. Detects the Android brand from the
 * User-Agent and shows the exact Settings path. Users can override the brand
 * via the dropdown in case detection is wrong.
 */
export function BrandPermissionGuide({ focusOn = 'all' }: Props) {
  const detected = useMemo(() => getDeviceInfo(), []);
  const [brand, setBrand] = useState<AndroidBrand>(detected.brand);
  const [openSection, setOpenSection] = useState<string | null>(focusOn === 'all' ? 'accessibility' : focusOn);
  const paths = BRAND_SETTINGS_PATHS[brand];

  const sections: Array<{ key: keyof typeof paths; label: string }> = [
    { key: 'accessibility', label: 'Accessibility Service' },
    { key: 'usageAccess', label: 'Usage Access' },
    { key: 'overlay', label: 'Display Over Other Apps' },
    { key: 'battery', label: 'Battery Optimization' },
  ];
  if (paths.autostart) sections.push({ key: 'autostart', label: 'Auto-Start (background survival)' });

  const filtered = focusOn === 'all' ? sections : sections.filter((s) => s.key === focusOn);

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-foreground">
        <Smartphone className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Step-by-Step Settings Guide</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {detected.isAndroid
            ? `Detected: Android ${detected.androidVersion ?? '?'}`
            : 'Not on Android — preview only'}
        </p>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value as AndroidBrand)}
          className="bg-muted text-foreground text-xs rounded-lg px-2 py-1 border border-border"
        >
          {BRAND_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b === 'unknown' ? 'Other / Stock' : b.charAt(0).toUpperCase() + b.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((section) => {
          const steps = paths[section.key] as string[] | undefined;
          if (!steps) return null;
          const isOpen = openSection === section.key;
          return (
            <div key={section.key} className="rounded-xl bg-muted/40 border border-border overflow-hidden">
              <button
                onClick={() => setOpenSection(isOpen ? null : section.key)}
                className="w-full px-3 py-2.5 flex items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-foreground">{section.label}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ol
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pb-3 text-xs text-muted-foreground space-y-1.5"
                  >
                    {steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary font-bold w-4 shrink-0">{i + 1}.</span>
                        <span className="flex items-center gap-1">
                          {step}
                          {i < steps.length - 1 && <ExternalLink className="w-2.5 h-2.5 opacity-60" />}
                        </span>
                      </li>
                    ))}
                  </motion.ol>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}