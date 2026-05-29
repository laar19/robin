package com.robin.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import com.robin.app.plugins.VoskPlugin;
import com.robin.app.plugins.WhisperPlugin;
import com.robin.app.plugins.TtsPlugin;
import com.robin.app.plugins.PiperPlugin;
import com.robin.app.plugins.FileHandlerPlugin;
import com.robin.app.plugins.AudioExtractorPlugin;
import com.robin.app.plugins.KeystorePlugin;
import com.robin.app.plugins.NotificationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(VoskPlugin.class);
        registerPlugin(WhisperPlugin.class);
        registerPlugin(TtsPlugin.class);
        registerPlugin(PiperPlugin.class);
        registerPlugin(FileHandlerPlugin.class);
        registerPlugin(AudioExtractorPlugin.class);
        registerPlugin(KeystorePlugin.class);
        registerPlugin(NotificationPlugin.class);
    }
}
