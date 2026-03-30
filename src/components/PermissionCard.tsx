import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PermissionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  granted: boolean | null;
  onGrant: () => void;
  loading?: boolean;
}

export function PermissionCard({ icon: Icon, title, description, granted, onGrant, loading }: PermissionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-5 transition-all ${
        granted === true ? 'neon-border border-green-500/30' : granted === false ? 'neon-border border-destructive/30' : 'neon-border'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          granted ? 'bg-green-500/15' : 'bg-primary/15'
        }`}>
          <Icon className={`w-6 h-6 ${granted ? 'text-green-400' : 'text-primary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            {granted === true ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : granted === false ? (
              <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
          {!granted && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onGrant}
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Grant Permission
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
