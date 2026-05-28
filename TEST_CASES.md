# Casos de Prueba — Robin App 🧪

**Versión:** 1.0.0-debug  
**APK:** `apk-output/Robin-debug.apk` (208 MB)  
**Fecha:** 28 mayo 2025

---

## 📋 Índice

1. [Pruebas de Instalación](#pruebas-de-instalación)
2. [Pruebas de Permisos](#pruebas-de-permisos)
3. [Pruebas STT (Vosk)](#pruebas-stt-vosk)
4. [Pruebas TTS (Android + Piper)](#pruebas-tts-android--piper)
5. [Pruebas de Memoria](#pruebas-de-memoria)
6. [Pruebas de UI](#pruebas-de-ui)
7. [Pruebas de Errores](#pruebas-de-errores)

---

## 🔧 Setup de Testing

### Dispositivos de prueba recomendados

| Dispositivo | RAM | Android | Estado |
|-------------|-----|---------|--------|
| Realme C55 | 4GB | 13 | ✅ Principal |
| Xiaomi Redmi 9A | 2GB | 10 | ⚠️ Límite mínimo |
| Samsung A03 | 3GB | 11 | ✅ Secundario |
| Emulator (AVD) | 4GB | 15 | ✅ Dev |

### Herramientas requeridas

```bash
# ADB instalado
adb version

# Verificar dispositivo conectado
adb devices

# Instalar APK
adb install apk-output/Robin-debug.apk

# Ver logs en tiempo real
adb logcat | grep -i robin
```

---

## 1. Pruebas de Instalación

### TC-001: Instalación en dispositivo físico

**Objetivo:** Verificar que el APK se instala correctamente

**Precondiciones:**
- Dispositivo con depuración USB activada
- APK generado en `apk-output/Robin-debug.apk`

**Pasos:**
```bash
adb install apk-output/Robin-debug.apk
```

**Resultado esperado:**
```
Success
```

**Criterio de aceptación:**
- [ ] Instalación completa sin errores
- [ ] Icono de app visible en launcher
- [ ] App se abre al tocar el icono

---

### TC-002: Instalación falla por espacio insuficiente

**Objetivo:** Verificar manejo de error cuando no hay espacio

**Precondiciones:**
- Dispositivo con <300MB libres

**Pasos:**
1. Intentar instalar APK
2. Observar mensaje de error

**Resultado esperado:**
```
Failure [INSTALL_FAILED_INSUFFICIENT_STORAGE]
```

**Criterio de aceptación:**
- [ ] Error claro indica espacio insuficiente
- [ ] App no se instala parcialmente

---

## 2. Pruebas de Permisos

### TC-010: Request de permiso de micrófono (primera vez)

**Objetivo:** Verificar que se solicita permiso RECORD_AUDIO

**Precondiciones:**
- App recién instalada
- Permiso de micrófono no concedido previamente

**Pasos:**
1. Abrir app
2. Observar dialog de permisos de Android

**Resultado esperado:**
- Dialog nativo de Android: "¿Permitir que Robin grabe audio?"

**Criterio de aceptación:**
- [ ] Dialog se muestra al abrir la app
- [ ] Botones "Permitir" y "Denegar" visibles
- [ ] Si se deniega, app muestra mensaje de error

---

### TC-011: Permiso concedido → App funciona

**Objetivo:** Verificar que app funciona con permiso concedido

**Precondiciones:**
- Permiso de micrófono concedido

**Pasos:**
1. Abrir app
2. Verificar que status muestra "Listo"

**Resultado esperado:**
- StatusBar verde: "Listo"
- Botón de grabación habilitado

**Criterio de aceptación:**
- [ ] No hay errores en logcat
- [ ] UI completamente funcional

---

### TC-012: Permiso denegado → App muestra error

**Objetivo:** Verificar manejo de permiso denegado

**Precondiciones:**
- Permiso de micrófono denegado

**Pasos:**
1. Abrir app
2. Observar comportamiento

**Resultado esperado:**
- Mensaje de error: "Permiso de micrófono requerido"
- Status: "Error"

**Criterio de aceptación:**
- [ ] Mensaje de error claro
- [ ] App no crashea
- [ ] No intenta grabar sin permiso

---

### TC-013: Permiso revocado en settings

**Objetivo:** Verificar que app detecta revocación de permiso

**Precondiciones:**
- Permiso previamente concedido
- App cerrada

**Pasos:**
1. Ir a Settings → Apps → Robin → Permissions
2. Revocar micrófono
3. Abrir app

**Resultado esperado:**
- App detecta permiso revocado
- Muestra error o re-solicita permiso

**Criterio de aceptación:**
- [ ] App no crashea
- [ ] Manejo graceful del error

---

## 3. Pruebas STT (Vosk)

### TC-020: Grabación y transcripción básica

**Objetivo:** Verificar STT funciona con Vosk

**Precondiciones:**
- Permiso de micrófono concedido
- Modelo Vosk cargado

**Pasos:**
1. Tocar "Iniciar Grabación"
2. Decir: "Hola Robin, ¿cómo estás?"
3. Tocar "Detener"

**Resultado esperado:**
- Status cambia: "Escuchando..." → "Procesando..." → "Listo"
- Transcripción aparece: "hola robin cómo estás"

**Criterio de aceptación:**
- [ ] Transcripción precisa (>80% accuracy)
- [ ] Sin crash o ANR
- [ ] Tiempo de respuesta <5 segundos

**Comando logcat:**
```bash
adb logcat | grep -E "VoskPlugin|onTranscription"
```

---

### TC-021: Transcripción en tiempo real (partial results)

**Objetivo:** Verificar updates parciales durante grabación

**Precondiciones:**
- Permiso concedido
- Vosk inicializado

**Pasos:**
1. Iniciar grabación
2. Hablar lentamente por 10 segundos
3. Observar transcripción mientras se habla

**Resultado esperado:**
- Texto aparece incrementalmente
- Status "Escuchando..." con animación

**Criterio de aceptación:**
- [ ] Updates parciales visibles
- [ ] Sin lag significativo
- [ ] Texto final coherente

---

### TC-022: STT con ruido ambiental

**Objetivo:** Verificar robustez con ruido

**Precondiciones:**
- Ambiente con ruido (ventilador, música suave)

**Pasos:**
1. Iniciar grabación con ruido de fondo
2. Hablar claramente
3. Detener grabación

**Resultado esperado:**
- Transcripción reconoce voz a pesar del ruido

**Criterio de aceptación:**
- [ ] Palabras clave reconocidas
- [ ] Accuracy >60% con ruido

---

### TC-023: STT con acento español latino

**Objetivo:** Verificar soporte para acentos

**Precondiciones:**
- Usuario con acento latino (México, Argentina, etc.)

**Pasos:**
1. Iniciar grabación
2. Decir frase con modismos locales

**Ejemplos:**
- México: "¿Qué onda? ¿Todo bien?"
- Argentina: "Che, ¿vos cómo estás?"
- Colombia: "¡Qué pena con usted!"

**Resultado esperado:**
- Transcripción reconoce modismos

**Criterio de aceptación:**
- [ ] Palabras comunes reconocidas
- [ ] Accuracy >70% para acento

---

## 4. Pruebas TTS (Android + Piper)

### TC-030: TTS nativo Android

**Objetivo:** Verificar TTS built-in funciona

**Precondiciones:**
- App inicializada
- TTS Plugin cargado

**Pasos:**
1. Escribir: "Hola, soy Robin"
2. Tocar "🔊 Escuchar"

**Resultado esperado:**
- Audio se reproduce
- Status: "Hablando..." → "Listo"

**Criterio de aceptación:**
- [ ] Audio audible
- [ ] Sin errores en logcat
- [ ] Volumen adecuado

**Comando logcat:**
```bash
adb logcat | grep -E "TtsPlugin|TextToSpeech"
```

---

### TC-031: TTS en español

**Objetivo:** Verificar TTS usa voz en español

**Precondiciones:**
- Idioma seleccionado: Español

**Pasos:**
1. Escribir texto en español
2. Reproducir TTS

**Resultado esperado:**
- Voz en español latino o castellano

**Criterio de aceptación:**
- [ ] Pronunciación correcta en español
- [ ] No usa voz en inglés por defecto

---

### TC-032: TTS con texto largo

**Objetivo:** Verificar TTS maneja textos largos

**Precondiciones:**
- App funcional

**Pasos:**
1. Escribir párrafo de 100+ palabras
2. Reproducir TTS

**Resultado esperado:**
- Todo el texto se lee completo
- Sin cortes ni errores

**Criterio de aceptación:**
- [ ] Texto completo reproducido
- [ ] Sin memory overflow
- [ ] Tiempo de reproducción razonable

---

### TC-033: Piper TTS (si implementado)

**Objetivo:** Verificar Piper como alternativa

**Precondiciones:**
- Modelo Piper cargado en assets
- Piper Plugin inicializado

**Pasos:**
1. Seleccionar Piper en settings
2. Escribir texto
3. Reproducir

**Resultado esperado:**
- Audio de mayor calidad que Android TTS

**Criterio de aceptación:**
- [ ] Audio audible
- [ ] Calidad superior a Android TTS
- [ ] Sin crash por ONNX

**Comando logcat:**
```bash
adb logcat | grep -E "PiperPlugin|OnnxTensor"
```

---

## 5. Pruebas de Memoria

### TC-040: Memory usage en idle

**Objetivo:** Medir memoria base de la app

**Precondiciones:**
- App abierta, sin grabar ni reproducir

**Pasos:**
```bash
adb shell dumpsys meminfo com.robin.app
```

**Resultado esperado:**
- Total PSS: <200 MB

**Criterio de aceptación:**
- [ ] Memory usage <200 MB en idle
- [ ] Sin memory leaks detectados

---

### TC-041: Memory usage durante STT

**Objetivo:** Medir memoria durante grabación

**Precondiciones:**
- App en foreground
- Grabación activa

**Pasos:**
1. Iniciar grabación
2. Ejecutar dumpsys meminfo

```bash
adb shell dumpsys meminfo com.robin.app
```

**Resultado esperado:**
- Total PSS: <350 MB (base + Vosk ~40MB)

**Criterio de aceptación:**
- [ ] Memory spike <150 MB adicional
- [ ] Sin OOM crash

---

### TC-042: Memory usage durante TTS

**Objetivo:** Medir memoria durante reproducción TTS

**Precondiciones:**
- TTS activo

**Pasos:**
1. Reproducir audio TTS
2. Ejecutar dumpsys meminfo

**Resultado esperado:**
- Total PSS: <400 MB

**Criterio de aceptación:**
- [ ] Sin memory leak
- [ ] Audio se completa sin crash

---

### TC-043: App en background por 5 minutos

**Objetivo:** Verificar que Android no mata la app

**Precondiciones:**
- App en foreground

**Pasos:**
1. Abrir app
2. Presionar Home (background)
3. Esperar 5 minutos
4. Re-abrir app desde recent apps

**Resultado esperado:**
- App se reanuda, no se reinicia

**Criterio de aceptación:**
- [ ] Estado se preserva
- [ ] Sin crash al reanudar

---

## 6. Pruebas de UI

### TC-050: StatusBar refleja estado correcto

**Objetivo:** Verificar que StatusBar muestra estados

**Estados a verificar:**
- [ ] Inactivo (gris)
- [ ] Listo (verde)
- [ ] Escuchando... (rojo, animado)
- [ ] Procesando... (amarillo)
- [ ] Hablando... (azul)
- [ ] Error (rojo)

**Criterio de aceptación:**
- [ ] Cada estado tiene color único
- [ ] Texto descriptivo claro
- [ ] Animación en "Escuchando"

---

### TC-051: Botón STT cambia estado

**Objetivo:** Verificar botón de grabación

**Pasos:**
1. Verificar botón inicial: "🎤 Iniciar Grabación"
2. Tocar botón
3. Verificar botón cambia a: "⏹ Detener"
4. Detener grabación
5. Verificar botón vuelve a estado inicial

**Criterio de aceptación:**
- [ ] Icono y texto cambian correctamente
- [ ] Animación de pulsación visible
- [ ] Estado coherente con acción

---

### TC-052: Selector de idioma funciona

**Objetivo:** Verificar cambio de idioma

**Pasos:**
1. Abrir settings
2. Cambiar idioma a English
3. Verificar que se guarda selección

**Criterio de aceptación:**
- [ ] Dropdown funciona
- [ ] Selección persiste (localStorage)
- [ ] STT/TTS usan idioma seleccionado

---

## 7. Pruebas de Errores

### TC-060: Modelo Vosk no encontrado

**Objetivo:** Verificar manejo de error si modelo falta

**Precondiciones:**
- Simular falta de modelo (renombrar carpeta models)

**Pasos:**
1. Iniciar app
2. Intentar grabar

**Resultado esperado:**
- Error claro: "Vosk model not found"
- App no crashea

**Criterio de aceptación:**
- [ ] Mensaje de error descriptivo
- [ ] App permanece funcional
- [ ] Fallback sugerido (si existe)

---

### TC-061: TTS falla por idioma no soportado

**Objetivo:** Verificar manejo de error TTS

**Precondiciones:**
- Seleccionar idioma no soportado por TTS nativo

**Pasos:**
1. Seleccionar idioma raro
2. Intentar TTS

**Resultado esperado:**
- Error manejado graceful
- Fallback a inglés o español

**Criterio de aceptación:**
- [ ] Sin crash
- [ ] Mensaje de error o fallback

---

### TC-062: App sin conexión a internet

**Objetivo:** Verificar que app funciona offline

**Precondiciones:**
- Modo avión activado
- Modelos ya descargados

**Pasos:**
1. Activar modo avión
2. Abrir app
3. Probar STT y TTS

**Resultado esperado:**
- STT y TTS funcionan offline

**Criterio de aceptación:**
- [ ] Vosk funciona sin internet
- [ ] Android TTS funciona sin internet
- [ ] Piper funciona sin internet
- [ ] No hay errores de red

---

## 📊 Resumen de Casos de Prueba

| Categoría | # Casos | Prioridad |
|-----------|---------|-----------|
| Instalación | 2 | Alta |
| Permisos | 4 | Crítica |
| STT | 4 | Alta |
| TTS | 4 | Alta |
| Memoria | 4 | Media |
| UI | 3 | Media |
| Errores | 3 | Alta |
| **Total** | **24** | - |

---

## ✅ Checklist de Release

```
[ ] TC-001: Instalación exitosa
[ ] TC-010: Permisos solicitados
[ ] TC-011: Permisos concedidos → funciona
[ ] TC-020: STT transcribe correctamente
[ ] TC-030: TTS reproduce audio
[ ] TC-040: Memory usage <200MB idle
[ ] TC-041: Memory usage <350MB STT
[ ] TC-062: Funciona offline
```

---

**Documento vivo — Actualizar con cada versión**
