# Default ProGuard rules
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# Capacitor
-keep class com.getcapacitor.** { *; }

# Vosk
-keep class org.vosk.** { *; }

# Robin plugins
-keep class com.robin.app.plugins.** { *; }
