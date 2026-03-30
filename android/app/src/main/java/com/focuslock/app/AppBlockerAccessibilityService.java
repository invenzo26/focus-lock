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

public class AppBlockerAccessibilityService extends AccessibilityService {

    private static final String TAG = "FocusLockBlocker";
    private static final String PREFS_NAME = "FocusLockPrefs";
    private static final String KEY_PACKAGES = "packages";
    private static final String KEY_BLOCKING = "blocking";

    private String lastBlockedPackage = "";
    private long lastBlockedTime = 0;
    private Handler handler;

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "Service Connected");

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
                | AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
                | AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS;
        info.notificationTimeout = 50;
        setServiceInfo(info);
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

        // Ignore system UI packages
        if (packageName.equals("com.android.systemui")
                || packageName.equals("com.android.launcher")
                || packageName.equals("com.android.launcher3")
                || packageName.equals("com.google.android.apps.nexuslauncher")
                || packageName.equals("com.miui.home")
                || packageName.equals("com.huawei.android.launcher")
                || packageName.equals("com.sec.android.app.launcher")
                || packageName.equals("com.oppo.launcher")
                || packageName.equals("com.realme.launcher")
                || packageName.equals("com.vivo.launcher")
                || packageName.startsWith("com.android.settings")) {
            return;
        }

        Log.d(TAG, "Opened: " + packageName);

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isBlocking = prefs.getBoolean(KEY_BLOCKING, false);

        if (!isBlocking) return;

        String packagesJson = prefs.getString(KEY_PACKAGES, "[]");

        try {
            JSONArray blockedArray = new JSONArray(packagesJson);

            for (int i = 0; i < blockedArray.length(); i++) {
                String blockedPkg = blockedArray.getString(i);

                if (packageName.equals(blockedPkg)) {
                    long now = System.currentTimeMillis();

                    // Debounce: prevent spamming lock screen
                    if (packageName.equals(lastBlockedPackage) && (now - lastBlockedTime) < 1200) {
                        return;
                    }

                    lastBlockedPackage = packageName;
                    lastBlockedTime = now;

                    Log.d(TAG, "BLOCKED: " + packageName);

                    // Launch lock screen immediately
                    launchLockScreen(packageName);

                    // Double-enforce after a short delay (anti-bypass for MIUI/Samsung)
                    handler.postDelayed(() -> {
                        SharedPreferences p = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                        if (p.getBoolean(KEY_BLOCKING, false)) {
                            launchLockScreen(packageName);
                        }
                    }, 400);

                    return;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing blocked packages", e);
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
