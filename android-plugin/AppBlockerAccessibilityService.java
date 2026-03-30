package app.lovable.focuslock;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.view.accessibility.AccessibilityEvent;

import org.json.JSONArray;

public class AppBlockerAccessibilityService extends AccessibilityService {

    private static final String PREFS_NAME = "focuslock_prefs";
    private static final String KEY_BLOCKED_PACKAGES = "blocked_packages";
    private static final String KEY_BLOCKING_ACTIVE = "blocking_active";

    private String lastBlockedApp = "";
    private long lastLaunchTime = 0;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        String packageName = String.valueOf(event.getPackageName());
        if (packageName == null) return;

        // Ignore our app
        if (packageName.equals(getPackageName())) return;

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isActive = prefs.getBoolean(KEY_BLOCKING_ACTIVE, false);
        if (!isActive) return;

        try {
            JSONArray blocked = new JSONArray(
                    prefs.getString(KEY_BLOCKED_PACKAGES, "[]")
            );

            for (int i = 0; i < blocked.length(); i++) {
                String blockedPkg = blocked.getString(i);

                if (packageName.equals(blockedPkg)) {

                    long now = System.currentTimeMillis();

                    // prevent spam launching
                    if (packageName.equals(lastBlockedApp) && (now - lastLaunchTime) < 1500) {
                        return;
                    }

                    lastBlockedApp = packageName;
                    lastLaunchTime = now;

                    // 🔥 FORCE LOCK SCREEN
                    Intent intent = new Intent(this, LockScreenActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    intent.putExtra("blocked_app", packageName);
                    startActivity(intent);

                    // 🔥 EXTRA FORCE: bring user back repeatedly
                    new Handler().postDelayed(() -> {
                        Intent i = new Intent(this, LockScreenActivity.class);
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(i);
                    }, 500);

                    return;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onInterrupt() {}

    @Override
    protected void onServiceConnected() {
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS;
        setServiceInfo(info);
    }
}