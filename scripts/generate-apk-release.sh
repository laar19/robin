#!/bin/bash
set -e

echo "🚀 Robin - Generando APK Release..."
echo ""

echo "📦 Instalando dependencias..."
npm install

echo "📥 Descargando modelos ML (si no existen)..."
if [ ! -d "models/vosk-model-small-es-0.42" ] || [ ! -f "models/ggml-tiny.bin" ] || [ ! -f "models/es_ES-mls-medium.onnx" ]; then
    ./scripts/download-models.sh
else
    echo "  ✓ Modelos ya presentes"
fi

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

echo "📱 Generando APK release..."
cd android && ./gradlew assembleRelease

echo "💾 Copiando APK a apk-output/..."
cd ..
mkdir -p apk-output
cp android/app/build/outputs/apk/release/app-release.apk apk-output/Robin-release.apk

echo ""
echo "✅ ¡APK Release generado exitosamente!"
echo "📍 Ubicación: apk-output/Robin-release.apk"
echo ""
echo "📲 Para instalar en tu dispositivo:"
echo "   adb install apk-output/Robin-release.apk"
