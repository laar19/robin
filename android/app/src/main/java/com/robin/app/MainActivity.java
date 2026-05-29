package com.robin.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

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
    }
}
