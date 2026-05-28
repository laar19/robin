#!/bin/bash
set -e

echo "🚀 Robin - Generando APK Debug..."
echo ""

echo "📦 Instalando dependencias..."
npm install

echo "🔨 Construyendo build de producción..."
npm run build

echo "🔄 Sincronizando con Android..."
npx cap sync android

echo "📥 Copiando modelos a assets de Android..."
mkdir -p android/app/src/main/assets/models
if [ -d "models/vosk-model-small-es-0.42" ]; then
    cp -r models/vosk-model-small-es-0.42 android/app/src/main/assets/models/
    echo "  ✓ Modelo Vosk copiado"
fi
if [ -f "models/ggml-tiny.bin" ]; then
    cp models/ggml-tiny.bin android/app/src/main/assets/models/
    echo "  ✓ Whisper tiny copiado"
fi
if [ -f "models/es_ES-mls-medium.onnx" ]; then
    cp models/es_ES-mls-medium.onnx android/app/src/main/assets/models/
    echo "  ✓ Piper TTS copiado"
fi

echo "📱 Generando APK debug..."
cd android && ./gradlew assembleDebug

echo "💾 Copiando APK a apk-output/..."
cd ..
mkdir -p apk-output
cp android/app/build/outputs/apk/debug/app-debug.apk apk-output/Robin-debug.apk

echo ""
echo "✅ ¡APK Debug generado exitosamente!"
echo "📍 Ubicación: apk-output/Robin-debug.apk"
echo ""
echo "📲 Para instalar en tu dispositivo:"
echo "   adb install apk-output/Robin-debug.apk"
