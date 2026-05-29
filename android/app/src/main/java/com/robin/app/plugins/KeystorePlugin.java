package com.robin.app.plugins;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.security.KeyStore;
import java.security.KeyStoreException;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

@CapacitorPlugin(name = "KeystorePlugin")
public class KeystorePlugin extends Plugin {
    
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String KEY_ALIAS = "RobinAppMasterKey";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;
    
    private KeyStore keyStore;
    
    @Override
    public void load() {
        try {
            keyStore = KeyStore.getInstance(ANDROID_KEYSTORE);
            keyStore.load(null);
            
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                generateKey();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    @PluginMethod
    public void encrypt(PluginCall call) {
        String plaintext = call.getString("plaintext");
        
        if (plaintext == null || plaintext.isEmpty()) {
            call.reject("Plaintext is required");
            return;
        }
        
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, getSecretKey());
            
            byte[] iv = cipher.getIV();
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes("UTF-8"));
            
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            
            String encoded = Base64.encodeToString(combined, Base64.DEFAULT);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("ciphertext", encoded);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Encryption failed: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void decrypt(PluginCall call) {
        String ciphertext = call.getString("ciphertext");
        
        if (ciphertext == null || ciphertext.isEmpty()) {
            call.reject("Ciphertext is required");
            return;
        }
        
        try {
            byte[] combined = Base64.decode(ciphertext, Base64.DEFAULT);
            
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] actualCiphertext = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, actualCiphertext, 0, actualCiphertext.length);
            
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), spec);
            
            byte[] plaintext = cipher.doFinal(actualCiphertext);
            String resultText = new String(plaintext, "UTF-8");
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("plaintext", resultText);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Decryption failed: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void isKeyGenerated(PluginCall call) {
        try {
            boolean exists = keyStore.containsAlias(KEY_ALIAS);
            JSObject result = new JSObject();
            result.put("generated", exists);
            call.resolve(result);
        } catch (KeyStoreException e) {
            call.reject("Error checking key: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void deleteKey(PluginCall call) {
        try {
            if (keyStore.containsAlias(KEY_ALIAS)) {
                keyStore.deleteEntry(KEY_ALIAS);
            }
            call.resolve();
        } catch (KeyStoreException e) {
            call.reject("Error deleting key: " + e.getMessage());
        }
    }
    
    private void generateKey() throws Exception {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES, 
            ANDROID_KEYSTORE
        );
        
        KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        );
        
        builder.setBlockModes(KeyProperties.BLOCK_MODE_GCM)
               .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
               .setKeySize(256)
               .setUserAuthenticationRequired(false)
               .setRandomizedEncryptionRequired(true);
        
        keyGenerator.init(builder.build());
        keyGenerator.generateKey();
    }
    
    private SecretKey getSecretKey() throws Exception {
        return (SecretKey) keyStore.getKey(KEY_ALIAS, null);
    }
}
