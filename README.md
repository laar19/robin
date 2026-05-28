# Robin 🎤🔊

**STT/TTS offline para Android - Procesamiento de voz 100% local**

Robin es una aplicación Android de código abierto para reconocimiento de voz (STT) y síntesis de voz (TTS) que funciona completamente offline. Diseñada para dispositivos de gama baja, procesa todo localmente sin enviar datos a la nube.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Android](https://img.shields.io/badge/Android-7.0+-green.svg)](https://www.android.com/)
[![Build](https://img.shields.io/badge/Build-Docker-blue.svg)](https://www.docker.com/)

## ✨ Características

- 🎤 **Reconocimiento de voz (STT)** - Conversión de voz a texto offline
- 🔊 **Síntesis de voz (TTS)** - Conversión de texto a voz offline
- 📱 **100% offline** - Sin conexión a internet requerida
- 🔒 **Privacidad total** - Todo se procesa localmente en tu dispositivo
- ⚡ **Optimizado para gama baja** - Funciona en MediaTek Helio G81, 4GB RAM
- 🌍 **Multilenguaje** - Soporte para Español, English, Português, Français, Deutsch

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Robin Android App                     │
├─────────────────────────────────────────────────────────┤
│  React 18 + Vite + Capacitor 5                          │
├─────────────────────────────────────────────────────────┤
│  STT Engines          │  TTS Engines                    │
│  ├─ Vosk (~40MB)     │  ├─ Android TTS (built-in)      │
│  └─ Whisper.cpp*     │  └─ Piper TTS (~100MB)          │
└─────────────────────────────────────────────────────────┘
```

*Whisper.cpp requiere build NDK adicional

## 📋 Requisitos

### Hardware mínimo
- CPU: MediaTek Helio G81 o equivalente (2x Cortex-A75 @2.0GHz + 6x Cortex-A55)
- RAM: 4 GB (disponible ~2.2GB)
- Almacenamiento: 500 MB libres
- Android: 7.0+ (API 24)

### Para build
- Docker y Docker Compose
- 5-6 GB de espacio en disco
- ADB (para instalar en dispositivo)

## 🚀 Inicio rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/laar19/robin.git
cd robin
```

### 2. Construir APK Debug (todo en Docker)

```bash
# Un solo comando - construye imagen y ejecuta contenedor
docker compose -f docker-compose.build.debug.yml up --build
```

**El contenedor hace automáticamente:**
1. Instala dependencias npm
2. Descarga modelos ML (~215MB): Vosk, Whisper, Piper
3. Build de producción Vite
4. Sync con Capacitor Android
5. Copia modelos a `android/app/src/main/assets/models/`
6. Ejecuta Gradle `assembleDebug`
7. Copia APK a `apk-output/` (volumen montado)

**Nota:** Todo ocurre **dentro del contenedor**. No necesitas instalar nada en tu PC excepto Docker.

El APK se genera en: `apk-output/Robin-debug.apk`

### 3. Instalar en dispositivo

```bash
adb install apk-output/Robin-debug.apk
```

## 🐳 Docker Builder

El proyecto usa Docker para builds reproducibles. **Todo el build ocurre dentro del contenedor.**

| Imagen | Tamaño | Uso |
|--------|--------|-----|
| `Dockerfile.debug` | ~3-4 GB | Build APK Debug |
| `Dockerfile.release` | ~3-4 GB | Build APK Release |
| `Dockerfile.dev` | ~500 MB | Desarrollo web |

### Comandos

```bash
# Build APK Debug (recomendado)
docker compose -f docker-compose.build.debug.yml up --build

# Build APK Release (requiere keystore)
docker compose -f docker-compose.build.release.yml up --build

# Script wrapper (opcional)
./scripts/build-apk.sh debug    # mismo que docker compose... debug
./scripts/build-apk.sh release  # mismo que docker compose... release
```

### Volúmenes

El contenedor monta:
- `.` → `/app` (código fuente)
- `./apk-output` → `/apk-output` (APK generado)
- `/var/run/docker.sock` (para operaciones Docker si necesarias)

### Desarrollo web

```bash
docker compose -f docker-compose.dev.yml up
```

Accede a http://localhost:5173

## 📁 Estructura del proyecto

```
robin/
├── src/                      # Código React
│   ├── components/           # Componentes UI
│   ├── services/             # Servicios STT/TTS
│   └── styles/               # Estilos globales
├── android/                  # Proyecto Android nativo
│   └── app/src/main/java/com/robin/app/plugins/
│       ├── VoskPlugin.java   # STT con Vosk
│       ├── TtsPlugin.java    # TTS nativo Android
│       ├── PiperPlugin.java  # TTS con Piper (ONNX)
│       └── WhisperPlugin.java # STT con Whisper.cpp
├── scripts/
│   ├── build-apk.sh          # Script principal de build
│   ├── generate-apk-debug.sh
│   ├── generate-apk-release.sh
│   └── download-models.sh    # Descarga modelos ML
├── docker-compose.*.yml      # Configuraciones Docker
├── Dockerfile.*              # Imágenes Docker
├── models/                   # Modelos ML (gitignored)
└── apk-output/               # APKs generados (gitignored)
```

## 🔧 Configuración

### Variables de entorno (.env)

```bash
VITE_APP_NAME=Robin
VITE_DEFAULT_STT=vosk
VITE_DEFAULT_TTS=android
VITE_DEFAULT_LANG=es
```

### Build de Release

Para generar un APK de release firmado:

1. Generar keystore:
```bash
keytool -genkey -v -keystore android/keystore/robin-release.keystore \
  -alias robin -keyalg RSA -keysize 2048 -validity 10000
```

2. Configurar variables:
```bash
export KEY_ALIAS=robin
export KEY_PASSWORD=tu_password
export STORE_PASSWORD=tu_password
export STORE_FILE=android/keystore/robin-release.keystore
```

3. Build:
```bash
./scripts/build-apk.sh release
```

## 🧪 Uso

### STT (Voz → Texto)

1. Abre la app
2. Presiona "Iniciar Grabación"
3. Habla
4. La transcripción aparece en tiempo real

### TTS (Texto → Voz)

1. Escribe texto en el campo
2. Presiona "🔊 Escuchar"
3. El texto se convierte en voz

### Cambiar motor

Ve a Configuración y selecciona:
- **STT:** Vosk (rápido) o Whisper (preciso)
- **TTS:** Android TTS (built-in) o Piper (mejor calidad)

## 📊 Uso de memoria

| Componente | RAM |
|------------|-----|
| Sistema Android | ~1.8 GB |
| WebView + React | ~200 MB |
| Vosk | ~40 MB |
| Piper TTS | ~150 MB |
| **Total** | ~2.2 GB |

✅ Funciona en dispositivos con 4GB RAM

## 🛠️ Desarrollo

### Modo desarrollo web

```bash
docker compose -f docker-compose.dev.yml up
```

Accede a http://localhost:5173

### Sincronizar con Android

```bash
npm run cap:sync
```

### Test

```bash
npm run test
```

### Descargar modelos manualmente (opcional)

```bash
./scripts/download-models.sh
```

## 📄 Licencia

Este proyecto está bajo la licencia [GNU Affero General Public License v3.0](LICENSE).

- ✅ Libre uso, modificación y distribución
- ✅ Requiere compartir modificaciones del código
- ✅ Ideal para apps que procesan datos localmente

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📞 Soporte

- **Issues:** [GitHub Issues](https://github.com/laar19/robin/issues)
- **Discusión:** [GitHub Discussions](https://github.com/laar19/robin/discussions)

## 🙏 Agradecimientos

- [Vosk](https://github.com/alphacep/vosk-android) - STT offline
- [Piper TTS](https://github.com/rhasspy/piper) - TTS neural
- [ONNX Runtime](https://onnxruntime.ai/) - Inferencia ML
- [Capacitor](https://capacitorjs.com/) - Bridge web ↔ nativo

## 📌 Roadmap

- [ ] Whisper.cpp NDK build completo
- [ ] Soporte para más idiomas
- [ ] Mejoras en UI/UX
- [ ] Modo de bajo consumo
- [ ] Exportar transcripciones

---

**Hecho con ❤️ para la comunidad de software libre**
