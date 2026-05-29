package com.robin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import android.content.Intent;
import android.net.Uri;
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.content.ContentResolver;
import android.webkit.MimeTypeMap;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.IOException;

@CapacitorPlugin(name = "FileHandler")
public class FileHandlerPlugin extends Plugin {

    private Uri sharedFileUri;
    private String sharedFileType;

    @Override
    protected void handleOnStart() {
        Intent intent = getActivity().getIntent();
        if (intent != null) {
            handleShareIntent(intent);
        }
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (intent != null) {
            handleShareIntent(intent);
        }
    }

    @PluginMethod()
    public void getSharedFile(PluginCall call) {
        if (sharedFileUri == null) {
            call.resolve();
            return;
        }

        try {
            String filePath = getRealPathFromURI(sharedFileUri);
            String fileName = getFileName(sharedFileUri);
            long fileSize = getFileSize(sharedFileUri);

            JSObject result = new JSObject();
            result.put("uri", sharedFileUri.toString());
            result.put("path", filePath);
            result.put("name", fileName);
            result.put("size", fileSize);
            result.put("type", sharedFileType);
            result.put("isVideo", sharedFileType != null && sharedFileType.startsWith("video/"));
            
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error getting shared file: " + e.getMessage());
        }
    }

    @PluginMethod()
    public void clearSharedFile(PluginCall call) {
        sharedFileUri = null;
        sharedFileType = null;
        call.resolve();
    }

    @PluginMethod()
    public void hasSharedFile(PluginCall call) {
        JSObject result = new JSObject();
        result.put("hasFile", sharedFileUri != null);
        call.resolve(result);
    }

    @PluginMethod()
    public void cleanupFile(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath != null) {
            try {
                File file = new File(filePath);
                if (file.exists()) {
                    file.delete();
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Error cleaning up file: " + e.getMessage());
            }
        } else {
            call.reject("File path required");
        }
    }

    private void handleShareIntent(Intent intent) {
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            if (type.startsWith("audio/") || type.startsWith("video/")) {
                sharedFileUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                sharedFileType = type;
                
                // Take persistable URI permission for Android 11+
                if (sharedFileUri != null) {
                    try {
                        getActivity().getContentResolver().takePersistableUriPermission(
                            sharedFileUri,
                            Intent.FLAG_GRANT_READ_URI_PERMISSION
                        );
                    } catch (SecurityException e) {
                        // Permission not granted, but we can still try to access
                        getActivity().grantUriPermission(
                            getActivity().getPackageName(),
                            sharedFileUri,
                            Intent.FLAG_GRANT_READ_URI_PERMISSION
                        );
                    }
                }
                
                notifyWebAppOfFile();
            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action) && type != null) {
            if (type.startsWith("audio/") || type.startsWith("video/")) {
                java.util.ArrayList<Uri> uris = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
                if (uris != null && !uris.isEmpty()) {
                    sharedFileUri = uris.get(0);
                    sharedFileType = type;
                    
                    // Take persistable URI permission
                    if (sharedFileUri != null) {
                        try {
                            getActivity().getContentResolver().takePersistableUriPermission(
                                sharedFileUri,
                                Intent.FLAG_GRANT_READ_URI_PERMISSION
                            );
                        } catch (SecurityException e) {
                            getActivity().grantUriPermission(
                                getActivity().getPackageName(),
                                sharedFileUri,
                                Intent.FLAG_GRANT_READ_URI_PERMISSION
                            );
                        }
                    }
                    
                    notifyWebAppOfFile();
                }
            }
        }
    }

    private void notifyWebAppOfFile() {
        JSObject data = new JSObject();
        data.put("hasSharedFile", true);
        data.put("type", sharedFileType);
        notifyListeners("onFileShared", data);
    }

    private String getRealPathFromURI(Uri uri) {
        if (uri == null) return null;
        
        ContentResolver resolver = getActivity().getContentResolver();
        Cursor cursor = null;
        
        try {
            cursor = resolver.query(uri, null, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(android.provider.MediaStore.Files.FileColumns.DATA);
                if (index >= 0) {
                    return cursor.getString(index);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (cursor != null) cursor.close();
        }
        
        return uri.getPath();
    }

    private String getFileName(Uri uri) {
        if (uri == null) return "unknown";
        
        ContentResolver resolver = getActivity().getContentResolver();
        Cursor cursor = null;
        
        try {
            cursor = resolver.query(uri, null, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    return cursor.getString(index);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (cursor != null) cursor.close();
        }
        
        String path = uri.getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private long getFileSize(Uri uri) {
        if (uri == null) return 0;
        
        ContentResolver resolver = getActivity().getContentResolver();
        Cursor cursor = null;
        
        try {
            cursor = resolver.query(uri, null, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.SIZE);
                if (index >= 0) {
                    return cursor.getLong(index);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (cursor != null) cursor.close();
        }
        
        return 0;
    }

    private File copyFileToCache(Uri uri) throws IOException {
        ContentResolver resolver = getActivity().getContentResolver();
        InputStream inputStream = resolver.openInputStream(uri);
        
        String fileName = getFileName(uri);
        File cacheDir = new File(getActivity().getCacheDir(), "robin_shared");
        cacheDir.mkdirs();
        
        File outputFile = new File(cacheDir, fileName);
        FileOutputStream outputStream = new FileOutputStream(outputFile);
        
        byte[] buffer = new byte[4096];
        int bytesRead;
        
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, bytesRead);
        }
        
        inputStream.close();
        outputStream.close();
        
        return outputFile;
    }
}
