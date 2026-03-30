package com.focuslock.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppBlockerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
