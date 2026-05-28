#!/bin/bash
set -e

TYPE="${1:-debug}"

if [ "$TYPE" != "debug" ] && [ "$TYPE" != "release" ]; then
  echo "Uso: ./scripts/build-apk.sh [debug|release]"
  echo "  debug   - Construye APK Debug (por defecto)"
  echo "  release - Construye APK Release"
  exit 1
fi

echo "🔨 Construyendo APK $TYPE de Robin..."
echo ""

docker compose -f "docker-compose.build.$TYPE.yml" up --build

echo ""
echo "✅ ¡Proceso completado!"
echo "📍 APK generado en: apk-output/"
