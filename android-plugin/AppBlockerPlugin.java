package app.lovable.focuslock;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.Process;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "AppBlocker")
public class AppBlockerPlugin extends Plugin {

    private static final String TAG = "FocusLockPlugin";
    private static final String PREFS_NAME = "FocusLockPrefs";
    private static final String KEY_PACKAGES = "packages";
    private static final String KEY_BLOCKING = "blocking";

    @PluginMethod
    public void startBlocking(PluginCall call) {
        JSArray packages = call.getArray("packages");
        if (packages == null) { call.reject("Missing packages list"); return; }
        String packagesJson = packages.toString();
        Log.d(TAG, "startBlocking: " + packagesJson);

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_PACKAGES, packagesJson).putBoolean(KEY_BLOCKING, true).commit();

        Intent svc = new Intent(getContext(), AppBlockerService.class);
        svc.setAction("START_BLOCKING");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) getContext().startForegroundService(svc);
        else getContext().startService(svc);

        call.resolve();
    }

    @PluginMethod
    public void stopBlocking(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_BLOCKING, false).putString(KEY_PACKAGES, "[]").commit();
        Intent svc = new Intent(getContext(), AppBlockerService.class);
        svc.setAction("STOP_BLOCKING");
        getContext().startService(svc);
        call.resolve();
    }

    @PluginMethod
    public void isAccessibilityEnabled(PluginCall call) {
        boolean enabled = isAccessibilityServiceEnabled();
        JSObject r = new JSObject(); r.put("enabled", enabled); call.resolve(r);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(i); call.resolve();
    }

    @PluginMethod
    public void isUsageAccessEnabled(PluginCall call) {
        AppOpsManager ops = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), getContext().getPackageName());
        JSObject r = new JSObject(); r.put("enabled", mode == AppOpsManager.MODE_ALLOWED); call.resolve(r);
    }

    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(i); call.resolve();
    }

    @PluginMethod
    public void isOverlayEnabled(PluginCall call) {
        JSObject r = new JSObject(); r.put("enabled", Settings.canDrawOverlays(getContext())); call.resolve(r);
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(i); call.resolve();
    }

    @PluginMethod
    public void isBatteryOptimizationDisabled(PluginCall call) {
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        JSObject r = new JSObject(); r.put("enabled", pm.isIgnoringBatteryOptimizations(getContext().getPackageName())); call.resolve(r);
    }

    @PluginMethod
    public void openBatteryOptimizationSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getContext().getPackageName()));
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(i); call.resolve();
    }

    @PluginMethod
    public void openAutoStartSettings(PluginCall call) {
        try {
            Intent intent = new Intent();
            String mfr = Build.MANUFACTURER.toLowerCase();
            if (mfr.contains("xiaomi") || mfr.contains("redmi"))
                intent.setClassName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity");
            else
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(intent);
        } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        JSArray arr = new JSArray();
        for (ApplicationInfo a : apps) {
            if (pm.getLaunchIntentForPackage(a.packageName) != null && !a.packageName.equals(getContext().getPackageName())) {
                JSObject o = new JSObject(); o.put("packageName", a.packageName); o.put("appName", pm.getApplicationLabel(a).toString()); arr.put(o);
            }
        }
        JSObject r = new JSObject(); r.put("apps", arr); call.resolve(r);
    }

    @PluginMethod
    public void setFocusTimer(PluginCall call) {
        long start = (long) call.getDouble("startTime", 0.0).doubleValue();
        int dur = call.getInt("durationSeconds", 0);
        getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
                .putLong("timer_start", start).putInt("timer_duration", dur).commit();
        call.resolve();
    }

    @PluginMethod
    public void getFocusTimerRemaining(PluginCall call) {
        SharedPreferences p = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long s = p.getLong("timer_start", 0); int d = p.getInt("timer_duration", 0);
        int rem = (s > 0 && d > 0) ? Math.max(0, d - (int)((System.currentTimeMillis() - s) / 1000)) : 0;
        JSObject r = new JSObject(); r.put("remaining", rem); call.resolve(r);
    }

    @PluginMethod
    public void clearFocusTimer(PluginCall call) {
        getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
                .remove("timer_start").remove("timer_duration").commit();
        call.resolve();
    }

    private boolean isAccessibilityServiceEnabled() {
        String svc = getContext().getPackageName() + "/" + AppBlockerAccessibilityService.class.getCanonicalName();
        String enabled = Settings.Secure.getString(getContext().getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabled == null) return false;
        TextUtils.SimpleStringSplitter sp = new TextUtils.SimpleStringSplitter(':');
        sp.setString(enabled);
        while (sp.hasNext()) { if (sp.next().equalsIgnoreCase(svc)) return true; }
        return false;
    }
}
