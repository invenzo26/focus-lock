package com.focuslock.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class LockScreenActivity extends Activity {

    private static final String TAG = "FocusLockScreen";
    private static final String PREFS_NAME = "FocusLockPrefs";
    private Handler handler = new Handler(Looper.getMainLooper());
    private boolean isNavigatingToApp = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                        | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                        | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                        | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );

        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );

        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.parseColor("#0a0a0f"));
        setFinishOnTouchOutside(false);

        String blockedApp = getIntent().getStringExtra("blocked_app");

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#0a0a0f"));
        root.setPadding(dp(32), dp(80), dp(32), dp(64));

        // Shield icon
        TextView icon = new TextView(this);
        icon.setText("🛡️");
        icon.setTextSize(TypedValue.COMPLEX_UNIT_SP, 80);
        icon.setGravity(Gravity.CENTER);
        root.addView(icon);

        // Title
        TextView title = new TextView(this);
        title.setText("App Blocked");
        title.setTextColor(Color.WHITE);
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 32);
        title.setTypeface(Typeface.create("sans-serif-medium", Typeface.BOLD));
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(24), 0, dp(12));
        root.addView(title);

        // Subtitle
        TextView subtitle = new TextView(this);
        subtitle.setText("You're in Focus Mode.\nThis app is blocked to help you stay productive.");
        subtitle.setTextColor(Color.parseColor("#9ca3af"));
        subtitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setLineSpacing(dp(2), 1.0f);
        subtitle.setPadding(0, 0, 0, dp(32));
        root.addView(subtitle);

        // Blocked app name
        if (blockedApp != null) {
            TextView appLabel = new TextView(this);
            String displayName = blockedApp;
            try {
                displayName = getPackageManager()
                        .getApplicationLabel(
                                getPackageManager().getApplicationInfo(blockedApp, 0)
                        ).toString();
            } catch (Exception ignored) {}

            appLabel.setText("Blocked: " + displayName);
            appLabel.setTextColor(Color.parseColor("#a78bfa"));
            appLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            appLabel.setTypeface(null, Typeface.BOLD);
            appLabel.setGravity(Gravity.CENTER);
            appLabel.setPadding(0, 0, 0, dp(48));
            root.addView(appLabel);
        }

        // Continue Focus button — returns user to FocusLock app
        Button continueBtn = new Button(this);
        continueBtn.setText("Continue Focus");
        continueBtn.setTextColor(Color.WHITE);
        continueBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        continueBtn.setTypeface(null, Typeface.BOLD);
        continueBtn.setAllCaps(false);

        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.parseColor("#7c3aed"));
        btnBg.setCornerRadius(dp(14));
        continueBtn.setBackground(btnBg);
        continueBtn.setPadding(dp(32), dp(18), dp(32), dp(18));

        continueBtn.setOnClickListener(v -> {
            isNavigatingToApp = true;
            Intent intent = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(intent);
            }
            finish();
        });

        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        btnParams.setMargins(dp(16), 0, dp(16), 0);
        root.addView(continueBtn, btnParams);

        setContentView(root);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (isNavigatingToApp) {
            Log.d(TAG, "onPause — returning to FocusLock app");
        }
    }

    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
    }

    @Override
    public void onBackPressed() {
        // Blocked — do nothing
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK
                || keyCode == KeyEvent.KEYCODE_HOME
                || keyCode == KeyEvent.KEYCODE_APP_SWITCH) {
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, value,
                getResources().getDisplayMetrics()
        );
    }
}
