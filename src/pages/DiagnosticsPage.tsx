import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, RefreshCw, CheckCircle2, XCircle, AlertCircle, Loader2,
  Shield, Eye, Layers, BatteryCharging, Download, Trash2, FileText,
} from 'lucide-react';
import { useNativeBlocker } from '@/hooks/useNativeBlocker';
import { permLog, PermissionLogEntry } from '@/lib/permissionLogger';
import { getDeviceInfo } from '@/lib/deviceInfo';
import { BrandPermissionGuide } from '@/components/permissions/BrandPermissionGuide';
import { toast } from 'sonner';

type CheckStatus = 'pending' | 'running' | 'ok' | 'fail' | 'error';

interface Check {
  key: 'accessibility' | 'usageAccess' | 'overlay' | 'batteryOptimization';
  label: string;
  icon: typeof Shield;
  status: CheckStatus;
  message: string;
}

const INITIAL_CHECKS: Check[] = [
  { key: 'accessibility', label: 'Accessibility Service', icon: Shield, status: 'pending', message: 'Not checked yet.' },
  { key: 'usageAccess', label: 'Usage Access', icon: Eye, status: 'pending', message: 'Not checked yet.' },
  { key: 'overlay', label: 'Display Over Other Apps', icon: Layers, status: 'pending', message: 'Not checked yet.' },
  { key: 'batteryOptimization', label: 'Battery Optimization Off', icon: BatteryCharging, status: 'pending', message: 'Not checked yet.' },
];

const STATUS_COPY: Record<CheckStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-muted-foreground' },
  running: { label: 'Checking…', color: 'text-primary' },
  ok: { label: 'Granted', color: 'text-green-400' },
  fail: { label: 'Missing', color: 'text-destructive' },
  error: { label: 'Plugin error', color: 'text-warning' },
};

export default function DiagnosticsPage() {
  const navigate = useNavigate();
  const {
    isNative, permissions, checkAllPermissions,
    openAccessibilitySettings, openUsageAccessSettings,
    openOverlaySettings, openBatteryOptimizationSettings,
  } = useNativeBlocker();
  const [checks, setChecks] = useState<Check[]>(INITIAL_CHECKS);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<PermissionLogEntry[]>(() => permLog.getAll());
  const device = getDeviceInfo();

  const runDiagnostics = useCallback(async () => {
    setRunning(true);
    setChecks((prev) => prev.map((c) => ({ ...c, status: 'running', message: 'Checking…' })));
    permLog.info('diagnostic', 'Diagnostics run started', { brand: device.brand, android: device.androidVersion });

    try {
      await checkAllPermissions();
    } catch (err) {
      permLog.error('plugin-error', 'checkAllPermissions threw', { error: String(err) });
    }
    // Permissions state will update via the hook; reflect it on next render below
    setTimeout(() => setRunning(false), 400);
  }, [checkAllPermissions, device.brand, device.androidVersion]);

  // Reflect permission state into check rows
  useEffect(() => {
    setChecks((prev) =>
      prev.map((c) => {
        const v = permissions[c.key];
        if (v === true) return { ...c, status: 'ok', message: 'Permission granted ✓' };
        if (v === false) return { ...c, status: 'fail', message: 'Permission missing — tap "Fix" to open Settings.' };
        if (v === null && c.status === 'running') return c;
        return { ...c, status: c.status === 'pending' ? 'pending' : c.status };
      }),
    );
  }, [permissions]);

  // Initial run on mount
  useEffect(() => {
    runDiagnostics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh logs panel when running
  useEffect(() => {
    const id = setInterval(() => setLogs(permLog.getAll()), 1500);
    return () => clearInterval(id);
  }, []);

  const fix = (key: Check['key']) => {
    permLog.info('settings-open', `User opened settings for ${key}`);
    switch (key) {
      case 'accessibility': return openAccessibilitySettings();
      case 'usageAccess': return openUsageAccessSettings();
      case 'overlay': return openOverlaySettings();
      case 'batteryOptimization': return openBatteryOptimizationSettings();
    }
  };

  const exportLogs = () => {
    const text = [
      `FocusLock Diagnostics Report`,
      `Generated: ${new Date().toISOString()}`,
      `Device: ${device.brandLabel}`,
      `Android: ${device.androidVersion ?? 'unknown'}`,
      `Native: ${isNative}`,
      `UA: ${device.rawUserAgent}`,
      ``,
      `--- Permission state ---`,
      ...checks.map((c) => `${c.label}: ${STATUS_COPY[c.status].label}`),
      ``,
      `--- Event log (${logs.length} entries) ---`,
      permLog.exportAsText(),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focuslock-diagnostics-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Diagnostics report downloaded');
  };

  const clearLogs = () => {
    permLog.clear();
    setLogs([]);
    toast('Event log cleared');
  };

  const allOk = checks.every((c) => c.status === 'ok');
  const failingCount = checks.filter((c) => c.status === 'fail' || c.status === 'error').length;

  return (
    <div className="min-h-screen bg-background p-5 pb-12">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg glass">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Permission Diagnostics</h1>
      </div>

      {/* Summary banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-4 mb-4 border ${
          allOk ? 'border-green-500/40 bg-green-500/10' :
          failingCount > 0 ? 'border-destructive/40 bg-destructive/10' :
          'border-primary/30 bg-primary/5'
        }`}
      >
        <div className="flex items-center gap-3">
          {allOk ? <CheckCircle2 className="w-6 h-6 text-green-400" /> :
            failingCount > 0 ? <AlertCircle className="w-6 h-6 text-destructive" /> :
            <Loader2 className="w-6 h-6 text-primary animate-spin" />}
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {allOk ? 'All permissions look good!' :
                failingCount > 0 ? `${failingCount} permission${failingCount === 1 ? '' : 's'} need attention` :
                'Running checks…'}
            </p>
            <p className="text-xs text-muted-foreground">
              {device.brandLabel}{device.androidVersion ? ` • Android ${device.androidVersion}` : ''}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Retry */}
      <button
        onClick={runDiagnostics}
        disabled={running}
        className="w-full mb-5 gradient-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
        {running ? 'Re-running checks…' : 'Re-run all checks'}
      </button>

      {/* Checks */}
      <div className="space-y-2 mb-5">
        {checks.map((c) => {
          const Icon = c.icon;
          const sc = STATUS_COPY[c.status];
          return (
            <div key={c.key} className="glass rounded-xl p-3 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                c.status === 'ok' ? 'bg-green-500/15' :
                c.status === 'fail' ? 'bg-destructive/15' :
                'bg-primary/10'
              }`}>
                <Icon className={`w-4 h-4 ${
                  c.status === 'ok' ? 'text-green-400' :
                  c.status === 'fail' ? 'text-destructive' : 'text-primary'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.label}</span>
                  <span className={`text-[10px] font-bold uppercase ${sc.color}`}>{sc.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.message}</p>
                {(c.status === 'fail' || c.status === 'error') && (
                  <button
                    onClick={() => fix(c.key)}
                    className="mt-2 text-xs font-bold text-primary underline underline-offset-2"
                  >
                    Fix in Settings →
                  </button>
                )}
              </div>
              {c.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
              {c.status === 'fail' && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Brand-aware guide */}
      <div className="mb-5">
        <BrandPermissionGuide focusOn="all" />
      </div>

      {/* Event log */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Event log</span>
            <span className="text-[10px] text-muted-foreground">({logs.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportLogs} className="text-xs text-primary flex items-center gap-1">
              <Download className="w-3 h-3" /> Export
            </button>
            <button onClick={clearLogs} className="text-xs text-destructive flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>
        <div className="bg-muted/40 rounded-lg p-2 max-h-60 overflow-auto font-mono text-[10px] leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-muted-foreground p-2">No events recorded yet.</p>
          ) : (
            logs.slice(-50).reverse().map((e, i) => (
              <div key={i} className={
                e.level === 'error' ? 'text-destructive' :
                e.level === 'warn' ? 'text-warning' :
                e.level === 'success' ? 'text-green-400' : 'text-muted-foreground'
              }>
                {new Date(e.ts).toLocaleTimeString()} [{e.category}] {e.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}