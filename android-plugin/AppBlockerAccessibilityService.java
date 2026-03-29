package app.lovable.focuslock;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;

import org.json.JSONArray;
import org.json.JSONException;

/**
 * Accessibility Service that monitors foreground app changes.
 * When a blocked app comes to the foreground, it launches LockScreenActivity.
 */
public class AppBlockerAccessibilityService extends AccessibilityService {

    private static final String PREFS_NAME = "focuslock_prefs";
    private static final String KEY_BLOCKED_PACKAGES = "blocked_packages";
    private static final String KEY_BLOCKING_ACTIVE = "blocking_active";

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        CharSequence packageNameCS = event.getPackageName();
        if (packageNameCS == null) return;
        String packageName = packageNameCS.toString();

        // Don't block our own app or the lock screen
        if (packageName.equals(getPackageName())) return;
        if (packageName.equals("app.lovable.focuslock.LockScreenActivity")) return;

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isActive = prefs.getBoolean(KEY_BLOCKING_ACTIVE, false);
        if (!isActive) return;

        String blockedJson = prefs.getString(KEY_BLOCKED_PACKAGES, "[]");
        try {
            JSONArray blocked = new JSONArray(blockedJson);
            for (int i = 0; i < blocked.length(); i++) {
                if (packageName.equals(blocked.getString(i))) {
                    // Launch the lock screen
                    Intent lockIntent = new Intent(this, LockScreenActivity.class);
                    lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    lockIntent.putExtra("blocked_app", packageName);
                    startActivity(lockIntent);
                    return;
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onInterrupt() {
        // Required override
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
        setServiceInfo(info);
    }
}
