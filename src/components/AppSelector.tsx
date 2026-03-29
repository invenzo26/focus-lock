import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const AVAILABLE_APPS = [
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'hsl(330 80% 55%)' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: 'hsl(145 70% 45%)' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: 'hsl(0 80% 50%)' },
  { id: 'twitter', name: 'Twitter / X', icon: '🐦', color: 'hsl(200 90% 50%)' },
  { id: 'facebook', name: 'Facebook', icon: '📘', color: 'hsl(220 70% 50%)' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'hsl(340 80% 55%)' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', color: 'hsl(50 90% 55%)' },
  { id: 'reddit', name: 'Reddit', icon: '🔴', color: 'hsl(15 90% 55%)' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', color: 'hsl(200 80% 50%)' },
  { id: 'discord', name: 'Discord', icon: '🎮', color: 'hsl(235 80% 65%)' },
];

interface AppSelectorProps {
  selected: string[];
  onSelectionChange: (apps: string[]) => void;
}

export function AppSelector({ selected, onSelectionChange }: AppSelectorProps) {
  const toggle = (id: string) => {
    onSelectionChange(
      selected.includes(id) ? selected.filter(a => a !== id) : [...selected, id]
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {AVAILABLE_APPS.map((app) => {
        const isSelected = selected.includes(app.id);
        return (
          <motion.button
            key={app.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toggle(app.id)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 ${
              isSelected
                ? 'border-primary bg-primary/10 glow-primary'
                : 'border-border bg-card hover:border-muted-foreground/30'
            }`}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full gradient-primary flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-primary-foreground" />
              </motion.div>
            )}
            <span className="text-2xl">{app.icon}</span>
            <span className="text-xs font-medium text-foreground">{app.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
