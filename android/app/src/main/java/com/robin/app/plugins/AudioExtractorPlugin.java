package com.robin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import android.media.MediaExtractor;
import android.media.MediaMuxer;
import android.media.MediaFormat;
import android.net.Uri;
import android.content.Context;

import java.io.File;
import java.io.IOException;

@CapacitorPlugin(name = "AudioExtractor")
public class AudioExtractorPlugin extends Plugin {

    private volatile boolean isCancelled = false;

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

                File outputFile = new File(outputDir, "extracted_audio_" + System.currentTimeMillis() + ".m4a");

                MediaExtractor extractor = new MediaExtractor();
                extractor.setDataSource(getContext(), uri, null);

                int audioTrackIndex = -1;
                MediaFormat audioFormat = null;

                for (int i = 0; i < extractor.getTrackCount(); i++) {
                    MediaFormat format = extractor.getTrackFormat(i);
                    String mime = format.getString(MediaFormat.KEY_MIME);
                    if (mime != null && mime.startsWith("audio/")) {
                        audioTrackIndex = i;
                        audioFormat = format;
                        break;
                    }
                }

                if (audioTrackIndex == -1) {
                    call.reject("No audio track found in video");
                    extractor.release();
                    return;
                }

                MediaMuxer muxer = new MediaMuxer(
                    outputFile.getAbsolutePath(),
                    MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4
                );

                int outputTrackIndex = muxer.addTrack(audioFormat);
                muxer.start();

                extractor.selectTrack(audioTrackIndex);

                int sampleSize = 5 * 1024 * 1024;
                java.nio.ByteBuffer buffer = java.nio.ByteBuffer.allocate(sampleSize);
                long totalSize = 0;
                long estimatedTotal = getEstimatedTotalSize(videoUri);

                while (!isCancelled) {
                    int offset = 0;
                    int readSize = extractor.readSampleData(buffer, offset);

                    if (readSize < 0) {
                        break;
                    }

                    buffer.position(0);

                    MediaFormat newFormat = extractor.getSampleTrackFormat();
                    muxer.writeSampleData(outputTrackIndex, buffer, extractor.getSampleMetaInfo());

                    buffer.clear();

                    totalSize += readSize;

                    if (estimatedTotal > 0) {
                        int progress = (int) ((totalSize * 100) / estimatedTotal);
                        JSObject progressData = new JSObject();
                        progressData.put("progress", Math.min(progress, 100));
                        notifyListeners("onProgress", progressData);
                    }

                    extractor.advance();
                }

                extractor.unselectTrack(audioTrackIndex);
                muxer.stop();
                muxer.release();
                extractor.release();

                if (isCancelled) {
                    outputFile.delete();
                    call.reject("Extraction cancelled");
                    return;
                }

                JSObject result = new JSObject();
                result.put("audioPath", outputFile.getAbsolutePath());
                result.put("audioUri", Uri.fromFile(outputFile).toString());
                result.put("success", true);
                call.resolve(result);

            } catch (IOException e) {
                call.reject("Error extracting audio: " + e.getMessage());
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
