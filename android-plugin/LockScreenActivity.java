package app.lovable.focuslock;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.TypedValue;
import android.view.Gravity;

/**
 * Full-screen activity shown when a blocked app is detected.
 * Prevents back button and forces user to stay inside FocusLock.
 */
public class LockScreenActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 🔥 SUPER LOCK MODE FLAGS
        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );

        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        // 🚫 Prevent outside touch closing
        setFinishOnTouchOutside(false);

        String blockedApp = getIntent().getStringExtra("blocked_app");

        // 🔥 ROOT LAYOUT
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.parseColor("#0a0a0f"));
        layout.setPadding(dp(32), dp(64), dp(32), dp(64));

        // 🚫 ICON
        TextView shield = new TextView(this);
        shield.setText("🚫");
        shield.setTextSize(TypedValue.COMPLEX_UNIT_SP, 72);
        shield.setGravity(Gravity.CENTER);
        layout.addView(shield);

        // 🧠 TITLE
        TextView title = new TextView(this);
        title.setText("App Blocked");
        title.setTextColor(Color.WHITE);
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        title.setTypeface(null, Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(24), 0, dp(8));
        layout.addView(title);

        // 📄 SUBTITLE
        TextView subtitle = new TextView(this);
        subtitle.setText("You're in Focus Mode.\nThis app is blocked to keep you productive.");
        subtitle.setTextColor(Color.parseColor("#9ca3af"));
        subtitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, 0, 0, dp(32));
        layout.addView(subtitle);

        // 📱 BLOCKED APP NAME
        if (blockedApp != null) {
            TextView appInfo = new TextView(this);
            try {
                String appName = getPackageManager()
                        .getApplicationLabel(
                                getPackageManager().getApplicationInfo(blockedApp, 0)
                        ).toString();

                appInfo.setText("Blocked: " + appName);
            } catch (Exception e) {
                appInfo.setText("Blocked: " + blockedApp);
            }

            appInfo.setTextColor(Color.parseColor("#a78bfa"));
            appInfo.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            appInfo.setGravity(Gravity.CENTER);
            appInfo.setPadding(0, 0, 0, dp(48));
            layout.addView(appInfo);
        }

        // 🔥 BUTTON
        Button continueBtn = new Button(this);
        continueBtn.setText("✅ Continue Focus");
        continueBtn.setTextColor(Color.WHITE);
        continueBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        continueBtn.setTypeface(null, Typeface.BOLD);
        continueBtn.setBackgroundColor(Color.parseColor("#7c3aed"));
        continueBtn.setPadding(dp(32), dp(16), dp(32), dp(16));

        continueBtn.setOnClickListener(v -> {
            // 🔥 FORCE USER OUT OF BLOCKED APP
            moveTaskToBack(true);

            // 🔥 REOPEN YOUR APP (ANTI-BYPASS)
            Intent intent = getPackageManager()
                    .getLaunchIntentForPackage(getPackageName());

            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            }
        });

        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        btnParams.setMargins(dp(16), 0, dp(16), 0);
        layout.addView(continueBtn, btnParams);

        setContentView(layout);
    }

    // 🚫 BLOCK BACK BUTTON
    @Override
    public void onBackPressed() {
        // Do nothing
    }

    // 🚫 BLOCK HARD KEYS
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK ||
                keyCode == KeyEvent.KEYCODE_HOME ||
                keyCode == KeyEvent.KEYCODE_APP_SWITCH) {
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
        );
    }
}