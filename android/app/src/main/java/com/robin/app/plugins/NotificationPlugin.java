package com.robin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.JSObject;

import android.app.NotificationManager;
import android.app.NotificationChannel;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

@CapacitorPlugin(name = "NotificationPlugin")
public class NotificationPlugin extends Plugin {
    
    private NotificationManager notificationManager;
    private static final String CHANNEL_ID = "robin_transcription_channel";
    private static final String CHANNEL_NAME = "Transcripciones Robin";
    private static final int DEFAULT_NOTIFICATION_ID = 1000;
    
    @Override
    public void load() {
        notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Notificaciones de procesamiento de transcripciones");
            channel.enableVibration(true);
            channel.setShowBadge(true);
            notificationManager.createNotificationChannel(channel);
        }
    }
    
    @PluginMethod
    public void showTranscriptionComplete(PluginCall call) {
        String title = call.getString("title", "Transcripción Completa");
        String message = call.getString("message", "Tu archivo ha sido procesado");
        String transcriptionId = call.getString("transcriptionId", "");
        
        Intent intent = new Intent(getContext(), MainActivity.class);
        intent.putExtra("transcriptionId", transcriptionId);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        int requestCode = transcriptionId.hashCode();
        PendingIntent pendingIntent = PendingIntent.getActivity(
            getContext(),
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE);
        
        notificationManager.notify(requestCode, builder.build());
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("notificationId", requestCode);
        call.resolve(result);
    }
    
    @PluginMethod
    public void showTranscriptionProgress(PluginCall call) {
        int progress = call.getInt("progress", 0);
        String title = call.getString("title", "Procesando...");
        String transcriptionId = call.getString("transcriptionId", "");
        
        int notificationId = transcriptionId.isEmpty() ? DEFAULT_NOTIFICATION_ID : transcriptionId.hashCode();
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle(title)
            .setContentText("Progreso: " + progress + "%")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setProgress(100, progress, false)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setOngoing(true);
        
        notificationManager.notify(notificationId, builder.build());
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("notificationId", notificationId);
        call.resolve(result);
    }
    
    @PluginMethod
    public void cancelNotification(PluginCall call) {
        int notificationId = call.getInt("notificationId", DEFAULT_NOTIFICATION_ID);
        notificationManager.cancel(notificationId);
        call.resolve();
    }
    
    @PluginMethod
    public void cancelAllNotifications(PluginCall call) {
        notificationManager.cancelAll();
        call.resolve();
    }
    
    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                JSObject result = new JSObject();
                result.put("granted", true);
                call.resolve(result);
            } else {
                requestPermissionForPermissionResult(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, call, "permissionCallback");
            }
        } else {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
        }
    }
    
    @PermissionCallback
    public void permissionCallback(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
        } else {
            JSObject result = new JSObject();
            result.put("granted", false);
            call.resolve(result);
        }
    }
}
