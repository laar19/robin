package com.robin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import android.content.Context;
import android.content.res.AssetManager;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;
import ai.onnxruntime.OrtException;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.FloatBuffer;
import java.nio.IntBuffer;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "PiperPlugin")
public class PiperPlugin extends Plugin {

    private OrtEnvironment ortEnv;
    private OrtSession session;
    private boolean initialized = false;
    private int sampleRate = 22050;

    @PluginMethod
    public void init(PluginCall call) {
        String modelPath = call.getString("modelPath", "models/es_ES-mls-medium.onnx");
        Context ctx = getContext();

        try {
            ortEnv = OrtEnvironment.getEnvironment();
            
            String fullPath;
            File modelFile = new File(modelPath);
            if (modelFile.isAbsolute() && modelFile.exists()) {
                fullPath = modelPath;
            } else {
                fullPath = ctx.getExternalFilesDir(null) + "/" + modelPath;
            }
            
            File f = new File(fullPath);
            if (!f.exists()) {
                copyAsset(ctx, modelPath, fullPath);
            }
            
            if (!f.exists()) {
                call.reject("Piper model not found at: " + fullPath);
                return;
            }

            OrtSession.SessionOptions options = new OrtSession.SessionOptions();
            options.setIntraOpNumThreads(1);
            session = ortEnv.createSession(fullPath, options);
            initialized = true;
            call.resolve();
        } catch (OrtException | IOException e) {
            call.reject("Failed to init Piper: " + e.getMessage());
        }
    }

    @PluginMethod
    public void synthesize(PluginCall call) {
        if (!initialized) {
            call.reject("Piper not initialized. Call init() first.");
            return;
        }

        String text = call.getString("text", "");
        if (text.isEmpty()) {
            call.reject("No text provided");
            return;
        }

        new Thread(() -> {
            try {
                float[] audioData = runInference(text);
                playAudio(audioData);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Synthesis failed: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void unload(PluginCall call) {
        if (session != null) {
            try {
                session.close();
            } catch (OrtException e) {
                // Ignore
            }
            session = null;
        }
        if (ortEnv != null) {
            ortEnv.close();
            ortEnv = null;
        }
        initialized = false;
        call.resolve();
    }

    private float[] runInference(String text) throws OrtException {
        int[] inputIds = tokenize(text);
        
        IntBuffer inputBuffer = IntBuffer.wrap(inputIds);
        long[] shape = {1, (long) inputIds.length};
        OnnxTensor inputTensor = OnnxTensor.createTensor(ortEnv, inputBuffer, shape);

        Map<String, OnnxTensor> inputs = new HashMap<>();
        inputs.put("input", inputTensor);

        try (OrtSession.Result result = session.run(inputs)) {
            OnnxTensor outputTensor = (OnnxTensor) result.get(0);
            FloatBuffer floatBuffer = (FloatBuffer) outputTensor.getValue();
            float[] audio = new float[floatBuffer.remaining()];
            floatBuffer.get(audio);
            return audio;
        } finally {
            inputTensor.close();
        }
    }

    private int[] tokenize(String text) {
        int[] tokens = new int[text.length() + 2];
        tokens[0] = 1;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c >= 32 && c < 127) {
                tokens[i + 1] = (int) c;
            } else {
                tokens[i + 1] = 32;
            }
        }
        tokens[text.length() + 1] = 2;
        return tokens;
    }

    private void playAudio(float[] samples) {
        if (samples.length == 0) return;

        int bufferSize = AudioTrack.getMinBufferSize(sampleRate,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT);

        AudioTrack track = new AudioTrack.Builder()
            .setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build())
            .setAudioFormat(new AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(sampleRate)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .build())
            .setBufferSizeInBytes(bufferSize)
            .build();

        track.play();

        byte[] buffer = new byte[samples.length * 2];
        int j = 0;
        for (int i = 0; i < samples.length; i++) {
            float sample = samples[i];
            sample = Math.max(-1.0f, Math.min(1.0f, sample));
            short val = (short) (sample * 32767);
            buffer[j++] = (byte) (val & 0xFF);
            buffer[j++] = (byte) ((val >> 8) & 0xFF);
        }

        track.write(buffer, 0, buffer.length);
        
        while (track.getPlayState() == AudioTrack.PLAYSTATE_PLAYING) {
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                break;
            }
        }
        
        track.stop();
        track.release();
    }

    private void copyAsset(Context ctx, String assetPath, String destPath) throws IOException {
        AssetManager assets = ctx.getAssets();
        File destFile = new File(destPath);
        destFile.getParentFile().mkdirs();
        
        try (InputStream in = assets.open(assetPath);
             OutputStream out = new FileOutputStream(destFile)) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
        }
    }
}
