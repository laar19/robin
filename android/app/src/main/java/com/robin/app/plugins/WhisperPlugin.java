package com.robin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "WhisperPlugin")
public class WhisperPlugin extends Plugin {

    @PluginMethod
    public void init(PluginCall call) {
        call.reject("Whisper STT not yet implemented. Requires whisper.cpp NDK build.");
    }

    @PluginMethod
    public void transcribe(PluginCall call) {
        call.reject("Whisper STT not yet implemented.");
    }

    @PluginMethod
    public void free(PluginCall call) {
        call.resolve();
    }
}
