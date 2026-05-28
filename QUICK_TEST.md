# Guía de Prueba Personal — Robin App 📱

**APK:** `apk-output/Robin-debug.apk` (208 MB)  
**Versión:** 1.0.0-debug

---

## 🚀 Instalación Rápida

```bash
# 1. Conectar dispositivo Android vía USB
# 2. Verificar que está conectado
adb devices

# 3. Instalar APK
adb install apk-output/Robin-debug.apk

# 4. Abrir la app desde tu dispositivo
```

---

## ✅ Checklist de Prueba (15 minutos)

### 1️⃣ Primera apertura (2 min)

- [ ] Tocar el icono de Robin
- [ ] **Debe aparecer:** Dialog pidiendo permiso de micrófono
- [ ] Tocar **"Permitir"**
- [ ] **Debe mostrar:** StatusBar verde con texto "Listo"

**❌ Si falla:**
- Dialog no aparece → Revisar logs: `adb logcat | grep Robin`
- Status no es "Listo" → Verificar permisos en Settings

---

### 2️⃣ Probar STT - Voz a Texto (3 min)

- [ ] Tocar botón **"🎤 Iniciar Grabación"**
- [ ] El botón cambia a **"⏹ Detener"** (rojo)
- [ ] Decir claramente: **"Hola Robin, ¿cómo estás?"**
- [ ] Tocar **"Detener"**
- [ ] **Debe aparecer:** Texto transcrito en el recuadro

**✅ Criterio de éxito:**
- Texto aparece aunque sea parcialmente correcto
- Ej: "hola robin cómo estás" o "ola robin komo estas"

**❌ Si falla:**
- Error "Vosk not initialized" → Modelo no se copió bien
- No hay texto → Revisar logs: `adb logcat | grep Vosk`

---

### 3️⃣ Probar TTS - Texto a Voz (3 min)

- [ ] En el campo de texto, escribir: **"Hola, soy Robin"**
- [ ] Tocar botón **"🔊 Escuchar"**
- [ ] **Debe sonar:** Voz diciendo el texto
- [ ] StatusBar cambia a "Hablando..."

**✅ Criterio de éxito:**
- Audio audible
- Voz en español (no inglés)

**❌ Si falla:**
- No hay audio → Verificar volumen del dispositivo
- Error "TTS not initialized" → Revisar logs: `adb logcat | grep Tts`

---

### 4️⃣ Probar Cambio de Idioma (2 min)

- [ ] Ir a sección **"Configuración"**
- [ ] En **"Idioma"**, seleccionar **English**
- [ ] Volver arriba
- [ ] Escribir: **"Hello world"**
- [ ] Tocar **"🔊 Escuchar"**
- [ ] **Debe sonar:** Voz en inglés

**✅ Criterio de éxito:**
- TTS usa voz en inglés

---

### 5️⃣ Probar en Background (2 min)

- [ ] Con la app abierta, presionar botón **Home**
- [ ] Esperar 10 segundos
- [ ] Volver a abrir la app desde recent apps
- [ ] **Debe:** Reanudar sin reiniciar

**✅ Criterio de éxito:**
- App no se reinició
- Estado se mantuvo

---

### 6️⃣ Probar sin Internet (3 min)

- [ ] Activar **Modo Avión**
- [ ] Abrir Robin
- [ ] Repetir prueba de STT (paso 2)
- [ ] Repetir prueba de TTS (paso 3)

**✅ Criterio de éxito:**
- **Ambos funcionan sin internet**
- No hay errores de red

---

## 🐛 Si encuentras bugs

### Capturar logs

```bash
# En tu PC, mientras usas la app:
adb logcat | grep -i robin > logs.txt

# O para ver en tiempo real:
adb logcat -s Robin
```

### Reportar error

Incluir:
1. ¿Qué estabas haciendo?
2. ¿Qué esperabas que pasara?
3. ¿Qué pasó realmente?
4. Logs adjuntos (`logs.txt`)

---

## 📊 Resultados de Prueba

Copia y pega esto después de probar:

```
## Mi Prueba Personal

**Dispositivo:** [Ej: Realme C55, Android 13]
**RAM:** [Ej: 4GB]
**Fecha:** [Fecha de prueba]

### Resultados:
- [ ] 1️⃣ Primera apertura: ✅ / ❌
- [ ] 2️⃣ STT funciona: ✅ / ❌
- [ ] 3️⃣ TTS funciona: ✅ / ❌
- [ ] 4️⃣ Cambio de idioma: ✅ / ❌
- [ ] 5️⃣ Background: ✅ / ❌
- [ ] 6️⃣ Offline: ✅ / ❌

### Bugs encontrados:
[Describir aquí]

### Logs:
[Adjuntar o pegar logs si hay error]
```

---

## 🎯 Criterio de Release

La app está lista para release si:

```
✅ 1️⃣ Primera apertura
✅ 2️⃣ STT funciona
✅ 3️⃣ TTS funciona
✅ 6️⃣ Offline funciona
```

Los otros son nice-to-have pero no bloqueantes.

---

## 📞 Contacto

**Repo:** https://github.com/laar19/robin  
**Issues:** https://github.com/laar19/robin/issues

---

**Tiempo estimado de prueba:** 15 minutos  
**Versión probada:** 1.0.0-debug
