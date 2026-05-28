#!/bin/bash
set -e

MODELS_DIR="models"
mkdir -p "$MODELS_DIR"

echo "📥 Descargando modelos para Robin..."

if [ ! -d "$MODELS_DIR/vosk-model-small-es-0.42" ]; then
    echo "  → Vosk español..."
    wget -q https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip -O /tmp/vosk.zip
    unzip -q /tmp/vosk.zip -d "$MODELS_DIR/"
    rm /tmp/vosk.zip
fi

if [ ! -f "$MODELS_DIR/ggml-tiny.bin" ]; then
    echo "  → Whisper tiny..."
    wget -q https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin -O "$MODELS_DIR/ggml-tiny.bin"
fi

if [ ! -f "$MODELS_DIR/ggml-small.bin" ]; then
    echo "  → Whisper small (opcional)..."
    wget -q https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin -O "$MODELS_DIR/ggml-small.bin"
fi

if [ ! -f "$MODELS_DIR/es_ES-mls-medium.onnx" ]; then
    echo "  → Piper es_ES-mls-medium..."
    wget -q https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls/medium/es_ES-mls-medium.onnx -O "$MODELS_DIR/es_ES-mls-medium.onnx"
    wget -q https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls/medium/es_ES-mls-medium.onnx.json -O "$MODELS_DIR/es_ES-mls-medium.onnx.json"
fi

echo ""
echo "✅ Modelos descargados en $MODELS_DIR/"
