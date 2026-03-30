package com.focuslock.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

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
        if (packages == null) {
            call.reject("Missing packages list");
            return;
        }

        Log.d(TAG, "Starting blocking with packages: " + packages.toString());

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putString(KEY_PACKAGES, packages.toString())
                .putBoolean(KEY_BLOCKING, true)
                .apply();

        // Start foreground service
        Intent serviceIntent = new Intent(getContext(), AppBlockerService.class);
        serviceIntent.setAction("START_BLOCKING");
        getContext().startForegroundService(serviceIntent);

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

        // Stop foreground service
        Intent serviceIntent = new Intent(getContext(), AppBlockerService.class);
        serviceIntent.setAction("STOP_BLOCKING");
        getContext().startService(serviceIntent);

        call.resolve();
    }

    @PluginMethod
    public void isAccessibilityEnabled(PluginCall call) {
        boolean enabled = checkAccessibilityEnabled();
        Log.d(TAG, "Accessibility enabled: " + enabled);

        JSObject result = new JSObject();
        result.put("enabled", enabled);
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
    public void isUsageAccessEnabled(PluginCall call) {
        android.app.AppOpsManager appOps = (android.app.AppOpsManager)
                getContext().getSystemService(Context.APP_OPS_SERVICE);

        int mode = appOps.checkOpNoThrow(
                android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                getContext().getPackageName()
        );

        JSObject result = new JSObject();
        result.put("enabled", mode == android.app.AppOpsManager.MODE_ALLOWED);
        call.resolve(result);
    }

    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        JSArray appsArray = new JSArray();

        for (ApplicationInfo appInfo : apps) {
            // Only include apps with a launcher icon (user-facing apps)
            if (pm.getLaunchIntentForPackage(appInfo.packageName) != null) {
                // Skip our own app
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
