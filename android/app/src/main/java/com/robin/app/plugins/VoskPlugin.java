package com.robin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import android.content.Context;
import android.content.res.AssetManager;
import android.media.AudioFormat;
import android.media.AudioRecord;

import org.vosk.Model;
import org.vosk.Recognizer;
import org.vosk.android.RecognitionListener;
import org.vosk.android.SpeechService;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;

@CapacitorPlugin(name = "VoskPlugin")
public class VoskPlugin extends Plugin {

    private Model voskModel;
    private SpeechService speechService;
    private Recognizer recognizer;

    @PluginMethod
    public void init(PluginCall call) {
        String lang = call.getString("lang", "es");
        Context ctx = getContext();

        String modelPath = ctx.getExternalFilesDir(null) + "/models/vosk-model-small-" + lang + "-0.42";
        File modelDir = new File(modelPath);

        try {
            if (!modelDir.exists()) {
                copyAssets(ctx, "models/vosk-model-small-" + lang + "-0.42", modelPath);
            }
        } catch (IOException e) {
            call.reject("Error copying Vosk model: " + e.getMessage());
            return;
        }

        if (!modelDir.exists()) {
            call.reject("Vosk model not found at: " + modelPath);
            return;
        }

        try {
            voskModel = new Model(modelPath);
            call.resolve();
        } catch (IOException e) {
            call.reject("Error loading Vosk model: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (voskModel == null) {
            call.reject("Vosk not initialized. Call init() first.");
            return;
        }

        try {
            recognizer = new Recognizer(voskModel, 16000.0f);
            speechService = new SpeechService(recognizer, 16000.0f);
            
            final PluginCall finalCall = call;
            speechService.startListening(new RecognitionListener() {
                @Override
                public void onResult(String hypothesis) {
                    JSObject data = new JSObject();
                    data.put("result", hypothesis);
                    notifyListeners("onTranscription", data);
                }

                @Override
                public void onPartialResult(String hypothesis) {
                    JSObject data = new JSObject();
                    data.put("partial", hypothesis);
                    notifyListeners("onPartialResult", data);
                }

                @Override
                public void onFinalResult(String hypothesis) {
                    JSObject data = new JSObject();
                    data.put("final", hypothesis);
                    notifyListeners("onFinalResult", data);
                }

                @Override
                public void onError(Exception e) {
                    JSObject data = new JSObject();
                    data.put("error", e.getMessage());
                    notifyListeners("onError", data);
                }

                @Override
                public void onTimeout() {
                    JSObject data = new JSObject();
                    data.put("timeout", true);
                    notifyListeners("onTimeout", data);
                }
            });
            finalCall.resolve();
        } catch (IOException e) {
            call.reject("Error starting Vosk: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        if (speechService != null) {
            speechService.stop();
            speechService = null;
        }
        if (recognizer != null) {
            recognizer.close();
            recognizer = null;
        }
        call.resolve();
    }

    @PluginMethod
    public void transcribeFile(PluginCall call) {
        String filePath = call.getString("filePath");
        
        if (filePath == null || filePath.isEmpty()) {
            call.reject("File path is required");
            return;
        }
        
        if (voskModel == null) {
            call.reject("Vosk not initialized. Call init() first.");
            return;
        }
        
        File audioFile = new File(filePath);
        if (!audioFile.exists()) {
            call.reject("File not found: " + filePath);
            return;
        }
        
        new Thread(() -> {
            try {
                // Read audio file as raw PCM data
                byte[] audioData = readAudioFile(filePath);
                
                if (audioData == null || audioData.length == 0) {
                    call.reject("Failed to read audio file or file is empty");
                    return;
                }
                
                // Create recognizer for file transcription
                Recognizer fileRecognizer = new Recognizer(voskModel, 16000.0f);
                
                StringBuilder result = new StringBuilder();
                int sampleRate = 16000;
                int bytesPerSample = 2; // 16-bit
                int chunkSize = 8000; // Process in chunks
                
                // Send audio data to recognizer
                for (int i = 0; i < audioData.length; i += chunkSize) {
                    int remaining = audioData.length - i;
                    int toRead = Math.min(chunkSize, remaining);
                    
                    boolean isSpeech = fileRecognizer.acceptWaveForm(audioData, i, toRead);
                    
                    if (isSpeech) {
                        String partialResult = fileRecognizer.getPartialResult();
                        if (partialResult != null && !partialResult.isEmpty()) {
                            JSObject progressData = new JSObject();
                            progressData.put("partial", partialResult);
                            progressData.put("progress", (i * 100) / audioData.length);
                            notifyListeners("onPartialTranscription", progressData);
                        }
                    }
                }
                
                // Get final result
                String finalResult = fileRecognizer.getFinalResult();
                if (finalResult != null && !finalResult.isEmpty()) {
                    result.append(finalResult);
                }
                
                fileRecognizer.close();
                
                JSObject response = new JSObject();
                response.put("text", result.toString().trim());
                response.put("success", true);
                call.resolve(response);
                
            } catch (Exception e) {
                call.reject("Error transcribing file: " + e.getMessage());
            }
        }).start();
    }
    
    @PluginMethod
    public void unload(PluginCall call) {
        stopListening(call);
        if (voskModel != null) {
            voskModel.close();
            voskModel = null;
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

    private void copyAssets(Context ctx, String assetPath, String destPath) throws IOException {
        AssetManager assets = ctx.getAssets();
        String[] files = assets.list(assetPath);
        
        if (files == null || files.length == 0) {
            new File(destPath).mkdirs();
            return;
        }

        new File(destPath).mkdirs();
        
        for (String filename : files) {
            String subPath = assetPath + "/" + filename;
            String destFilePath = destPath + "/" + filename;
            
            try (InputStream in = assets.open(subPath)) {
                File destFile = new File(destFilePath);
                if (in.available() > 0 && !destFile.exists()) {
                    try (OutputStream out = new FileOutputStream(destFile)) {
                        byte[] buffer = new byte[4096];
                        int read;
                        while ((read = in.read(buffer)) != -1) {
                            out.write(buffer, 0, read);
                        }
                    }
                } else if (!destFile.exists()) {
                    copyAssets(ctx, subPath, destFilePath);
                }
            } catch (IOException e) {
                copyAssets(ctx, subPath, destFilePath);
            }
        }
    }
}
