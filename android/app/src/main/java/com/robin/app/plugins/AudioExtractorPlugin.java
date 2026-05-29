package com.robin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import android.media.MediaExtractor;
import android.media.MediaMuxer;
import android.media.MediaFormat;
import android.media.MediaCodec;
import android.net.Uri;
import android.content.Context;

import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;

@CapacitorPlugin(name = "AudioExtractor")
public class AudioExtractorPlugin extends Plugin {

    private volatile boolean isCancelled = false;
    private String lastExtractedPath = null;

    @PluginMethod()
    public void extractAudio(PluginCall call) {
        String videoUri = call.getString("videoUri");
        String outputDir = call.getString("outputDir", getContext().getCacheDir().getAbsolutePath());

        isCancelled = false;

        new Thread(() -> {
            try {
                Uri uri = Uri.parse(videoUri);
                
                if (videoUri.startsWith("/")) {
                    uri = Uri.fromFile(new File(videoUri));
                }

                MediaExtractor extractor = new MediaExtractor();
                extractor.setDataSource(getContext(), uri, null);

                int audioTrackIndex = -1;
                MediaFormat audioFormat = null;
                String audioMimeType = null;
                StringBuilder availableTracks = new StringBuilder();

                for (int i = 0; i < extractor.getTrackCount(); i++) {
                    MediaFormat format = extractor.getTrackFormat(i);
                    String mime = format.getString(MediaFormat.KEY_MIME);
                    if (mime != null) {
                        availableTracks.append(mime).append(" ");
                        if (mime.startsWith("audio/")) {
                            audioTrackIndex = i;
                            audioFormat = format;
                            audioMimeType = mime;
                            break;
                        }
                    }
                }

                if (audioTrackIndex == -1) {
                    extractor.release();
                    JSObject errorData = new JSObject();
                    errorData.put("error", "No audio track found");
                    errorData.put("availableTracks", availableTracks.toString().trim());
                    errorData.put("videoUri", videoUri);
                    call.reject("No audio track found. Available: " + availableTracks.toString().trim());
                    return;
                }

                File outputFile = new File(outputDir, "extracted_audio_" + System.currentTimeMillis() + ".m4a");

                MediaMuxer muxer = new MediaMuxer(
                    outputFile.getAbsolutePath(),
                    MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4
                );

                int outputTrackIndex = muxer.addTrack(audioFormat);
                muxer.start();
                extractor.selectTrack(audioTrackIndex);

                int sampleSize = 5 * 1024 * 1024;
                ByteBuffer buffer = ByteBuffer.allocate(sampleSize);
                long totalSize = 0;
                long estimatedTotal = getEstimatedTotalSize(videoUri);

                while (!isCancelled) {
                    buffer.clear();
                    int readSize = extractor.readSampleData(buffer, 0);

                    if (readSize < 0) {
                        break;
                    }

                    buffer.limit(readSize);
                    buffer.position(0);

                    MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
                    bufferInfo.offset = 0;
                    bufferInfo.size = readSize;
                    bufferInfo.presentationTimeUs = extractor.getSampleTime();
                    bufferInfo.flags = extractor.getSampleFlags();

                    muxer.writeSampleData(outputTrackIndex, buffer, bufferInfo);

                    totalSize += readSize;

                    if (estimatedTotal > 0) {
                        int progress = (int) ((totalSize * 100) / estimatedTotal);
                        JSObject progressData = new JSObject();
                        progressData.put("progress", Math.min(progress, 100));
                        notifyListeners("onProgress", progressData);
                    }

                    if (!extractor.advance()) {
                        break;
                    }
                }

                muxer.stop();
                muxer.release();
                extractor.release();

                if (isCancelled) {
                    outputFile.delete();
                    call.reject("Extraction cancelled");
                    return;
                }

                lastExtractedPath = outputFile.getAbsolutePath();

                JSObject result = new JSObject();
                result.put("audioPath", outputFile.getAbsolutePath());
                result.put("audioUri", Uri.fromFile(outputFile).toString());
                result.put("audioFormat", audioMimeType);
                result.put("success", true);
                call.resolve(result);

            } catch (IOException e) {
                JSObject errorData = new JSObject();
                errorData.put("error", "IO error: " + e.getMessage());
                errorData.put("videoUri", videoUri);
                call.reject("Error extracting audio: " + e.getMessage());
            } catch (IllegalStateException e) {
                call.reject("Unsupported video format or codec: " + e.getMessage());
            } catch (Exception e) {
                call.reject("Error: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod()
    public void cancelExtraction(PluginCall call) {
        isCancelled = true;
        call.resolve();
    }

    @PluginMethod()
    public void cleanup(PluginCall call) {
        String filePath = call.getString("filePath");
        
        if (filePath == null && lastExtractedPath != null) {
            filePath = lastExtractedPath;
        }
        
        if (filePath != null) {
            try {
                File file = new File(filePath);
                if (file.exists()) {
                    file.delete();
                }
                lastExtractedPath = null;
                call.resolve();
            } catch (Exception e) {
                call.reject("Error cleaning up file: " + e.getMessage());
            }
        } else {
            call.reject("No file path provided");
        }
    }

    @PluginMethod()
    public void cleanupAll(PluginCall call) {
        try {
            File cacheDir = new File(getContext().getCacheDir(), "robin_extracted");
            if (cacheDir.exists()) {
                deleteDirectory(cacheDir);
            }
            lastExtractedPath = null;
            call.resolve();
        } catch (Exception e) {
            call.reject("Error cleaning up: " + e.getMessage());
        }
    }

    private void deleteDirectory(File dir) {
        if (dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File file : files) {
                    deleteDirectory(file);
                }
            }
            dir.delete();
        } else {
            dir.delete();
        }
    }

    private long getEstimatedTotalSize(String videoUri) {
        try {
            File file = new File(videoUri);
            if (file.exists()) {
                return file.length();
            }
            
            Uri uri = Uri.parse(videoUri);
            if (uri.getScheme() != null && uri.getScheme().startsWith("content")) {
                android.database.Cursor cursor = getContext().getContentResolver()
                    .query(uri, null, null, null, null);
                if (cursor != null) {
                    try {
                        if (cursor.moveToFirst()) {
                            int sizeIndex = cursor.getColumnIndex(android.provider.OpenableColumns.SIZE);
                            if (sizeIndex >= 0) {
                                return cursor.getLong(sizeIndex);
                            }
                        }
                    } finally {
                        cursor.close();
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;
    }
}
