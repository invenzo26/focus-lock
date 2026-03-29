package app.lovable.focuslock;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.List;

@CapacitorPlugin(name = "AppBlocker")
public class AppBlockerPlugin extends Plugin {

    private static final String PREFS_NAME = "focuslock_prefs";
    private static final String KEY_BLOCKED_PACKAGES = "blocked_packages";
    private static final String KEY_BLOCKING_ACTIVE = "blocking_active";

    @PluginMethod
    public void startBlocking(PluginCall call) {
        JSArray packages = call.getArray("packages");
        if (packages == null) {
            call.reject("Missing packages list");
            return;
        }

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(KEY_BLOCKED_PACKAGES, packages.toString())
            .putBoolean(KEY_BLOCKING_ACTIVE, true)
            .apply();

        // Start the foreground service to keep blocking alive
        Intent serviceIntent = new Intent(getContext(), AppBlockerService.class);
        serviceIntent.setAction("START_BLOCKING");
        getContext().startForegroundService(serviceIntent);

        call.resolve();
    }

    @PluginMethod
    public void stopBlocking(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .remove(KEY_BLOCKED_PACKAGES)
            .putBoolean(KEY_BLOCKING_ACTIVE, false)
            .apply();

        // Stop the foreground service
        Intent serviceIntent = new Intent(getContext(), AppBlockerService.class);
        serviceIntent.setAction("STOP_BLOCKING");
        getContext().startService(serviceIntent);

        call.resolve();
    }

    @PluginMethod
    public void isAccessibilityEnabled(PluginCall call) {
        boolean enabled = isAccessibilityServiceEnabled();
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
    public void getInstalledApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        JSArray appsArray = new JSArray();

        for (ApplicationInfo appInfo : apps) {
            // Only include launchable apps (skip system services)
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

    private boolean isAccessibilityServiceEnabled() {
        String serviceName = getContext().getPackageName() + "/" + 
            AppBlockerAccessibilityService.class.getCanonicalName();
        
        String enabledServices = Settings.Secure.getString(
            getContext().getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );

        if (enabledServices == null) return false;
        
        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabledServices);
        while (splitter.hasNext()) {
            if (splitter.next().equalsIgnoreCase(serviceName)) return true;
        }
        return false;
    }
}
