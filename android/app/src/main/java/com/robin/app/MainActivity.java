package com.robin.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.robin.app.plugins.VoskPlugin;
import com.robin.app.plugins.WhisperPlugin;
import com.robin.app.plugins.TtsPlugin;
import com.robin.app.plugins.PiperPlugin;
import com.robin.app.plugins.FileHandlerPlugin;
import com.robin.app.plugins.AudioExtractorPlugin;
import com.robin.app.plugins.KeystorePlugin;
import com.robin.app.plugins.NotificationPlugin;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VoskPlugin.class);
        registerPlugin(WhisperPlugin.class);
        registerPlugin(TtsPlugin.class);
        registerPlugin(PiperPlugin.class);
        registerPlugin(FileHandlerPlugin.class);
        registerPlugin(AudioExtractorPlugin.class);
        registerPlugin(KeystorePlugin.class);
        registerPlugin(NotificationPlugin.class);
        
        super.onCreate(savedInstanceState);
        
        requestMicrophonePermission();
    }
    
    private void requestMicrophonePermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, 
                new String[]{Manifest.permission.RECORD_AUDIO}, 
                PERMISSION_REQUEST_CODE);
        }
    }
}
