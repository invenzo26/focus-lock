package com.focuslock.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;

public class AppBlockerService extends Service {

    private static final String TAG = "FocusLockService";
    private static final String CHANNEL_ID = "focuslock_channel";
    private static final int NOTIFICATION_ID = 9001;
    private static final String PREFS_NAME = "FocusLockPrefs";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Log.d(TAG, "Service Created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "STOP_BLOCKING".equals(intent.getAction())) {
            Log.d(TAG, "Stopping blocking service");
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        Log.d(TAG, "Starting blocking service");

        Intent mainIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, mainIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notification = new Notification.Builder(this, CHANNEL_ID)
                    .setContentTitle("FocusLock Active")
                    .setContentText("Focus mode is running. Blocked apps are restricted.")
                    .setSmallIcon(android.R.drawable.ic_lock_lock)
                    .setContentIntent(pendingIntent)
                    .setOngoing(true)
                    .setCategory(Notification.CATEGORY_SERVICE)
                    .build();
        }

        if (notification != null) {
            startForeground(NOTIFICATION_ID, notification);
        }

        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Re-start service if user swipes app from recents
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isBlocking = prefs.getBoolean("blocking", false);

        if (isBlocking) {
            Log.d(TAG, "Task removed but blocking active — restarting service");
            Intent restartIntent = new Intent(this, AppBlockerService.class);
            restartIntent.setAction("START_BLOCKING");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(restartIntent);
            } else {
                startService(restartIntent);
            }
        }

        super.onTaskRemoved(rootIntent);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "FocusLock Blocking",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows when FocusLock is actively blocking apps");
            channel.setShowBadge(false);

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }
}
