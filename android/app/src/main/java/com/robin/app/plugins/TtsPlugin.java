package com.robin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import android.content.Context;
import android.speech.tts.TextToSpeech;
import android.os.Build;

import java.util.Locale;

@CapacitorPlugin(name = "TtsPlugin")
public class TtsPlugin extends Plugin {

    private TextToSpeech tts;
    private boolean initialized = false;

    @PluginMethod
    public void init(PluginCall call) {
        Context ctx = getContext();
        tts = new TextToSpeech(ctx, status -> {
            if (status == TextToSpeech.SUCCESS) {
                initialized = true;
                call.resolve();
            } else {
                call.reject("Failed to initialize TTS");
            }
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        if (!initialized) {
            call.reject("TTS not initialized");
            return;
        }

        String text = call.getString("text", "");
        String lang = call.getString("lang", "es");
        float speed = call.getFloat("speed", 1.0f);
        float pitch = call.getFloat("pitch", 1.0f);

        Locale locale = new Locale(lang);
        tts.setLanguage(locale);
        tts.setSpeechRate(speed);
        tts.setPitch(pitch);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "tts_id");
        } else {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null);
        }

        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) {
            tts.stop();
        }
        call.resolve();
    }

    @PluginMethod
    public void getVoices(PluginCall call) {
        if (tts == null) {
            call.reject("TTS not initialized");
            return;
        }

        try {
            java.util.Set<Locale> locales = tts.getAvailableLanguages();
            JSObject result = new JSObject();
            org.json.JSONArray voicesArray = new org.json.JSONArray();
            for (Locale l : locales) {
                voicesArray.put(l.getDisplayName() + " (" + l.toLanguageTag() + ")");
            }
            result.put("voices", voicesArray);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error getting voices: " + e.getMessage());
        }
    }
}
