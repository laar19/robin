package com.robin.app.plugins;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import android.content.Context;
import android.content.res.AssetManager;

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
        long maxFileSize = call.getInt("maxFileSize", 100) * 1024 * 1024;
        
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
        
        if (audioFile.length() > maxFileSize) {
            call.reject("File too large: " + (audioFile.length() / (1024 * 1024)) + "MB exceeds limit of " + (maxFileSize / (1024 * 1024)) + "MB");
            return;
        }
        
        new Thread(() -> {
            try {
                FileInputStream fis = new FileInputStream(audioFile);
                byte[] buffer = new byte[8000];
                int bytesRead;
                
                Recognizer fileRecognizer = new Recognizer(voskModel, 16000.0f);
                StringBuilder result = new StringBuilder();
                int totalBytes = 0;
                long fileSize = audioFile.length();
                
                while ((bytesRead = fis.read(buffer)) != -1) {
                    if (fileRecognizer.acceptWaveForm(buffer, bytesRead)) {
                        String partial = fileRecognizer.getPartialResult();
                        if (partial != null && !partial.isEmpty()) {
                            JSObject progressData = new JSObject();
                            progressData.put("partial", partial);
                            totalBytes += bytesRead;
                            int progress = (int)((totalBytes * 100) / fileSize);
                            progressData.put("progress", progress);
                            notifyListeners("onPartialTranscription", progressData);
                        }
                    }
                    totalBytes += bytesRead;
                }
                
                String finalResult = fileRecognizer.getFinalResult();
                if (finalResult != null && !finalResult.isEmpty()) {
                    result.append(finalResult);
                }
                
                fileRecognizer.close();
                fis.close();
                
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
