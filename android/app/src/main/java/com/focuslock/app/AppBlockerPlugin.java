package com.focuslock.app;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
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

    private static final String TAG = "AppBlockerPlugin";
    private static final String PREFS_NAME = "FocusLockPrefs";
    private static final String KEY_PACKAGES = "packages";
    private static final String KEY_BLOCKING = "blocking";

    @PluginMethod
    public void startBlocking(PluginCall call) {
        JSArray packages = call.getArray("packages");
        if (packages == null) { call.reject("Missing packages list"); return; }

        Log.d(TAG, "Starting blocking with packages: " + packages.toString());

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putString(KEY_PACKAGES, packages.toString())
                .putBoolean(KEY_BLOCKING, true)
                .commit();

        Intent serviceIntent = new Intent(getContext(), AppBlockerService.class);
        serviceIntent.setAction("START_BLOCKING");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }

        call.resolve();
    }

    @PluginMethod
    public void stopBlocking(PluginCall call) {
        Log.d(TAG, "Stopping blocking");

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putString(KEY_PACKAGES, "[]")
                .putBoolean(KEY_BLOCKING, false)
                .apply();

        Intent serviceIntent = new Intent(getContext(), AppBlockerService.class);
        serviceIntent.setAction("STOP_BLOCKING");
        getContext().startService(serviceIntent);

        call.resolve();
    }

    @PluginMethod
    public void isAccessibilityEnabled(PluginCall call) {
        boolean enabled = checkAccessibilityEnabled();
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void isUsageAccessEnabled(PluginCall call) {
        AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                getContext().getPackageName()
        );
        JSObject result = new JSObject();
        result.put("enabled", mode == AppOpsManager.MODE_ALLOWED);
        call.resolve(result);
    }

    @PluginMethod
    public void isOverlayEnabled(PluginCall call) {
        boolean enabled = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            enabled = Settings.canDrawOverlays(getContext());
        }
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void isBatteryOptimizationDisabled(PluginCall call) {
        boolean disabled = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            disabled = pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        }
        JSObject result = new JSObject();
        result.put("enabled", disabled);
        call.resolve(result);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void openBatteryOptimizationSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + getContext().getPackageName()));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void openAutoStartSettings(PluginCall call) {
        // Try common MIUI/Xiaomi auto-start intent
        try {
            Intent intent = new Intent();
            intent.setClassName("com.miui.securitycenter",
                    "com.miui.permcenter.autostart.AutoStartManagementActivity");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        } catch (Exception e) {
            // Fallback: open general app settings
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:" + getContext().getPackageName()));
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception ex) {
                Log.e(TAG, "Could not open auto-start settings", ex);
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        JSArray appsArray = new JSArray();

        for (ApplicationInfo appInfo : apps) {
            if (pm.getLaunchIntentForPackage(appInfo.packageName) != null) {
                if (appInfo.packageName.equals(getContext().getPackageName())) continue;
                JSObject appObj = new JSObject();
                appObj.put("packageName", appInfo.packageName);
                appObj.put("appName", pm.getApplicationLabel(appInfo).toString());
                appsArray.put(appObj);
            }
        }

        JSObject result = new JSObject();
        result.put("apps", appsArray);
        call.resolve(result);
    }

    // --- Timer methods for background-safe focus timer ---

    @PluginMethod
    public void setFocusTimer(PluginCall call) {
        long startTime = (long) call.getDouble("startTime", 0.0).doubleValue();
        int durationSeconds = call.getInt("durationSeconds", 0);

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putLong("timer_start", startTime)
                .putInt("timer_duration", durationSeconds)
                .apply();

        Log.d(TAG, "Focus timer set: start=" + startTime + " duration=" + durationSeconds);
        call.resolve();
    }

    @PluginMethod
    public void getFocusTimerRemaining(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long startTime = prefs.getLong("timer_start", 0);
        int durationSeconds = prefs.getInt("timer_duration", 0);

        int remaining = 0;
        if (startTime > 0 && durationSeconds > 0) {
            long elapsed = (System.currentTimeMillis() - startTime) / 1000;
            remaining = Math.max(0, durationSeconds - (int) elapsed);
        }

        JSObject result = new JSObject();
        result.put("remaining", remaining);
        call.resolve(result);
    }

    @PluginMethod
    public void clearFocusTimer(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .remove("timer_start")
                .remove("timer_duration")
                .apply();
        call.resolve();
    }

    private boolean checkAccessibilityEnabled() {
        String expectedService = getContext().getPackageName() + "/"
                + AppBlockerAccessibilityService.class.getCanonicalName();

        String enabledServices = Settings.Secure.getString(
                getContext().getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );

        if (enabledServices == null) return false;

        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabledServices);

        while (splitter.hasNext()) {
            String service = splitter.next();
            if (service.equalsIgnoreCase(expectedService)) {
                return true;
            }
        }

        return false;
    }
}
