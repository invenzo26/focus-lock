package com.focuslock.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;

import org.json.JSONArray;

import java.util.HashSet;
import java.util.Set;

public class AppBlockerAccessibilityService extends AccessibilityService {

    private static final String TAG = "FocusLockBlocker";
    private static final String PREFS_NAME = "FocusLockPrefs";
    private static final String KEY_PACKAGES = "packages";
    private static final String KEY_BLOCKING = "blocking";

    private String lastBlockedPackage = "";
    private long lastBlockedTime = 0;
    private Handler handler;

    // Cache to avoid parsing JSON on every event
    private Set<String> blockedSet = new HashSet<>();
    private boolean isBlocking = false;
    private long lastPrefsRead = 0;

    private static final Set<String> SYSTEM_PACKAGES = new HashSet<>();
    static {
        SYSTEM_PACKAGES.add("com.android.systemui");
        SYSTEM_PACKAGES.add("com.android.launcher");
        SYSTEM_PACKAGES.add("com.android.launcher3");
        SYSTEM_PACKAGES.add("com.google.android.apps.nexuslauncher");
        SYSTEM_PACKAGES.add("com.miui.home");
        SYSTEM_PACKAGES.add("com.huawei.android.launcher");
        SYSTEM_PACKAGES.add("com.sec.android.app.launcher");
        SYSTEM_PACKAGES.add("com.oppo.launcher");
        SYSTEM_PACKAGES.add("com.realme.launcher");
        SYSTEM_PACKAGES.add("com.vivo.launcher");
        SYSTEM_PACKAGES.add("com.android.settings");
        SYSTEM_PACKAGES.add("com.android.packageinstaller");
        SYSTEM_PACKAGES.add("com.google.android.permissioncontroller");
    }

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        Log.d(TAG, "Service Created");
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "Service Connected");

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
                | AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
        info.notificationTimeout = 50;
        setServiceInfo(info);

        refreshPrefs();
    }

    private void refreshPrefs() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        isBlocking = prefs.getBoolean(KEY_BLOCKING, false);
        String packagesJson = prefs.getString(KEY_PACKAGES, "[]");
        lastPrefsRead = System.currentTimeMillis();

        Log.d(TAG, "refreshPrefs - blocking: " + isBlocking + ", packages: " + packagesJson);

        blockedSet.clear();
        try {
            JSONArray arr = new JSONArray(packagesJson);
            for (int i = 0; i < arr.length(); i++) {
                blockedSet.add(arr.getString(i));
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing packages JSON", e);
        }

        Log.d(TAG, "Blocked set (" + blockedSet.size() + "): " + blockedSet);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        CharSequence pkgCharSeq = event.getPackageName();
        if (pkgCharSeq == null) return;
        String packageName = pkgCharSeq.toString();

        // Never block ourselves
        if (packageName.equals(getPackageName())) return;

        // Ignore system packages
        if (SYSTEM_PACKAGES.contains(packageName) || packageName.startsWith("com.android.settings")) {
            return;
        }

        // Re-read prefs every 1 second max to catch new blocking sessions
        long now = System.currentTimeMillis();
        if (now - lastPrefsRead > 1000) {
            refreshPrefs();
        }

        if (!isBlocking) return;

        Log.d(TAG, "Opened: " + packageName);

        if (blockedSet.contains(packageName)) {
            // Debounce
            if (packageName.equals(lastBlockedPackage) && (now - lastBlockedTime) < 1200) {
                return;
            }

            lastBlockedPackage = packageName;
            lastBlockedTime = now;

            Log.d(TAG, "BLOCKED: " + packageName);

            launchLockScreen(packageName);

            // Double-enforce after delay
            handler.postDelayed(() -> {
                if (isBlocking && blockedSet.contains(packageName)) {
                    launchLockScreen(packageName);
                }
            }, 400);
        }
    }

    private void launchLockScreen(String blockedPackage) {
        Intent intent = new Intent(this, LockScreenActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_NO_ANIMATION);
        intent.putExtra("blocked_app", blockedPackage);
        startActivity(intent);
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "Service Interrupted");
    }
}
