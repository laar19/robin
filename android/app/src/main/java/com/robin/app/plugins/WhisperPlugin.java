package com.robin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import android.content.Context;
import android.content.res.AssetManager;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import io.github.ggerganov.whispercpp.WhisperContext;
import io.github.ggerganov.whispercpp.WhisperFullParams;
import io.github.ggerganov.whispercpp.model.WhisperModel;
import io.github.ggerganov.whispercpp.params.WhisperContextParams;
import io.github.ggerganov.whispercpp.params.WhisperSamplingStrategy;
import io.github.ggerganov.whispercpp.params.CParam;

@CapacitorPlugin(name = "WhisperPlugin")
public class WhisperPlugin extends Plugin {

    private WhisperContext whisperContext;
    private String modelPath;

    @PluginMethod
    public void init(PluginCall call) {
        String path = call.getString("modelPath", "models/ggml-tiny.bin");
        modelPath = path;
        
        new Thread(() -> {
            try {
                Context ctx = getContext();
                File modelFile;
                
                // Check if model is in assets or external storage
                String externalModelPath = ctx.getExternalFilesDir(null) + "/" + path;
                File externalModel = new File(externalModelPath);
                
                if (externalModel.exists()) {
                    modelFile = externalModel;
                } else {
                    // Try to copy from assets
                    String destPath = ctx.getCacheDir() + "/whisper/" + new File(path).getName();
                    copyAsset(ctx, path, destPath);
                    modelFile = new File(destPath);
                }
                
                if (!modelFile.exists()) {
                    call.reject("Whisper model not found: " + path);
                    return;
                }
                
                // Initialize whisper context
                WhisperContextParams params = WhisperContextParams.builder()
                    .useGpu(true)
                    .flashAttn(true)
                    .build();
                
                whisperContext = WhisperContext.newInstance(modelFile.getAbsolutePath(), params);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("modelPath", modelFile.getAbsolutePath());
                call.resolve(result);
                
            } catch (Exception e) {
                call.reject("Error loading Whisper model: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void transcribeFile(PluginCall call) {
        String filePath = call.getString("filePath");
        String language = call.getString("language", "es");
        String task = call.getString("task", "transcribe"); // transcribe or translate
        
        if (filePath == null || filePath.isEmpty()) {
            call.reject("File path is required");
            return;
        }
        
        if (whisperContext == null) {
            call.reject("Whisper not initialized. Call init() first.");
            return;
        }
        
        File audioFile = new File(filePath);
        if (!audioFile.exists()) {
            call.reject("File not found: " + filePath);
            return;
        }
        
        new Thread(() -> {
            try {
                // Read audio file
                byte[] audioData = readAudioFile(filePath);
                
                if (audioData == null || audioData.length == 0) {
                    call.reject("Failed to read audio file or file is empty");
                    return;
                }
                
                // Convert to float array (whisper.cpp expects float PCM data)
                float[] audioFloats = bytesToFloats(audioData);
                
                // Set up transcription parameters
                CParam.GreedyParams greedyParams = CParam.GreedyParams.builder()
                    .bestOf(1)
                    .build();
                
                WhisperFullParams params = WhisperFullParams.builder()
                    .strategy(WhisperSamplingStrategy.WHISPER_SAMPLING_GREEDY)
                    .greedyParams(greedyParams)
                    .language(language)
                    .task(task.equals("translate") ? 1 : 0) // 0 = transcribe, 1 = translate
                    .printProgress(false)
                    .printRealtime(false)
                    .printTimestamps(false)
                    .build();
                
                // Transcribe
                String transcription = whisperContext.fullTranscribe(params, audioFloats);
                
                // Notify progress (100% since it's done)
                JSObject progressData = new JSObject();
                progressData.put("progress", 100);
                notifyListeners("onProgress", progressData);
                
                JSObject response = new JSObject();
                response.put("text", transcription.trim());
                response.put("success", true);
                response.put("language", language);
                call.resolve(response);
                
            } catch (Exception e) {
                call.reject("Error transcribing file: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void free(PluginCall call) {
        if (whisperContext != null) {
            whisperContext.close();
            whisperContext = null;
        }
        call.resolve();
    }
    
    private byte[] readAudioFile(String filePath) throws IOException {
        File file = new File(filePath);
        FileInputStream fis = new FileInputStream(file);
        byte[] audioData = new byte[(int) file.length()];
        fis.read(audioData);
        fis.close();
        return audioData;
    }
    
    private float[] bytesToFloats(byte[] bytes) {
        // Convert 16-bit PCM to float array
        // Assuming little-endian 16-bit signed PCM
        int numSamples = bytes.length / 2;
        float[] floats = new float[numSamples];
        
        ByteBuffer buffer = ByteBuffer.wrap(bytes);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        
        for (int i = 0; i < numSamples; i++) {
            short sample = buffer.getShort();
            floats[i] = sample / 32768.0f; // Normalize to [-1, 1]
        }
        
        return floats;
    }
    
    private void copyAsset(Context ctx, String assetPath, String destPath) throws IOException {
        File destFile = new File(destPath);
        destFile.getParentFile().mkdirs();
        
        try (InputStream in = ctx.getAssets().open(assetPath);
             OutputStream out = new FileOutputStream(destFile)) {
            
            byte[] buffer = new byte[4096];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
        }
    }
}
