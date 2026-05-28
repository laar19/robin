# Premortem — Robin App 🔍

**Fecha:** 28 de mayo 2025  
**Proyecto:** Robin - STT/TTS offline para Android  
**Estado:** APK Debug generado (208 MB)

---

## 🪦 Escenario: "Robin falló 6 meses después del lanzamiento"

### Causas probables del fracaso:

---

## 1. ❌ Build/CI/CD

### Problemas identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Build falla en otras máquinas** | Alta | Crítico | ✅ Docker ya soluciona esto |
| **Modelos ML cambian de URL** | Media | Alto | Usar mirrors o descargar una vez y versionar |
| **Gradle/SDK versions obsoletas** | Media | Medio | Pin versions específicas en variables.gradle |
| **Docker image muy grande (~4GB)** | Alta | Medio | Documentar requirements claros |
| **Build time >30 min primera vez** | Alta | Medio | Documentar caché de Docker |

### Acciones requeridas

```bash
# TODO: Pin versiones específicas
# android/variables.gradle
compileSdkVersion = 34  # ✅ ya está
targetSdkVersion = 34   # ✅ ya está
```

---

## 2. ❌ Rendimiento/Memoria

### Problemas identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **OOM en dispositivos 2GB RAM** | Alta | Crítico | Testear en gama baja real |
| **Vosk carga ~40MB en heap** | Media | Alto | Monitorear memory usage |
| **Piper ONNX ~150MB adicionales** | Media | Alto | Lazy load, unload cuando no se usa |
| **Gradle build consume 8GB RAM host** | Media | Medio | Documentar requisitos de build |

### Memory budget actual

```
Dispositivo objetivo: Helio G81, 4GB RAM
├─ Sistema Android:     ~1.8 GB
├─ WebView + React:     ~200 MB
├─ Vosk STT:            ~40 MB
├─ Piper TTS:           ~150 MB
├─ Android TTS:         ~50 MB
└─ Buffer sistema:      ~200 MB
    ─────────────────────────
    Total estimado:      ~2.4 GB ✅ (dentro de 4GB)
```

### Acciones requeridas

- [ ] Agregar `android:largeHeap="true"` en AndroidManifest.xml
- [ ] Implementar unload de modelos cuando la app va a background
- [ ] Agregar monitoreo de memoria en debug build
- [ ] Testear en dispositivo físico con 2GB RAM

---

## 3. ❌ Funcionalidad STT/TTS

### Problemas identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Vosk no transcribe bien español** | Media | Alto | Testear accuracy con dataset real |
| **Piper modelo es_ES no encontrado** | Media | Alto | Verificar copy de assets en build |
| **Permissions de micrófono fallan** | Alta | Crítico | Request runtime permissions correctamente |
| **TTS nativo no tiene voz en español** | Media | Medio | Fallback a Piper si Android TTS falla |
| **Whisper.cpp no implementado** | Alta | Medio | Documentar como "coming soon" |

### Acciones requeridas

- [ ] Implementar runtime permission request para RECORD_AUDIO
- [ ] Agregar fallback: si Vosk falla → usar Android speech recognition
- [ ] Agregar fallback: si Piper falla → usar Android TTS
- [ ] Testear con acentos latinos variados (México, Argentina, Colombia, etc.)

---

## 4. ❌ UX/UI

### Problemas identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **UI muy básica/no pulida** | Media | Medio | Diseñar UI más atractiva |
| **No hay feedback visual de escucha** | Media | Bajo | Agregar waveform o animación |
| **Transcripción en tiempo real lenta** | Media | Medio | Optimizar listener callbacks |
| **No hay manejo de errores claro** | Alta | Alto | Agregar toasts/mensajes de error |

### Acciones requeridas

- [ ] Agregar animación de "escuchando..." (pulso)
- [ ] Mostrar confidence score de transcripción
- [ ] Agregar retry button cuando falla STT/TTS
- [ ] Mostrar progreso de descarga de modelos (primera vez)

---

## 5. ❌ Distribución

### Problemas identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **APK 208MB muy grande para Play Store** | Media | Alto | Usar App Bundle (.aab) |
| **No hay signing para release** | Alta | Alto | Documentar creación de keystore |
| **No hay versionamiento semántico** | Media | Medio | Agregar versionCode/versionName |
| **No hay changelog** | Baja | Bajo | Agregar CHANGELOG.md |

### Acciones requeridas

- [ ] Configurar build de .aab además de .apk
- [ ] Documentar proceso de signing release
- [ ] Agregar versionCode automático desde git tags
- [ ] Crear template de release notes

---

## 6. ❌ Licencias/ Legal

### Problemas identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Vosk license incompatible con AGPL** | Baja | Crítico | Verificar licencia Vosk (Apache 2.0 ✅) |
| **ONNX Runtime license** | Baja | Alto | Verificar (MIT ✅) |
| **Modelos Vosk/Whisper/Piper licenses** | Media | Alto | Verificar cada modelo |
| **No hay attributions** | Media | Medio | Agregar ABOUT.md con credits |

### Verificación de licencias

```
Componente          │ Licencia     │ Compatible AGPL?
────────────────────┼──────────────┼─────────────────
Robin (app)         │ AGPL-3.0     │ N/A
Vosk SDK            │ Apache 2.0   │ ✅ Sí
ONNX Runtime        │ MIT          │ ✅ Sí
Whisper.cpp         │ MIT          │ ✅ Sí
Piper TTS           │ MIT          │ ✅ Sí
Android TTS         │ Propietario  │ ✅ (built-in)
Capacitor           │ MIT          │ ✅ Sí
React               │ MIT          │ ✅ Sí
Vite                │ MIT          │ ✅ Sí
```

### Acciones requeridas

- [ ] Crear archivo ABOUT.md con attributions
- [ ] Agregar pantalla de "Licencias de terceros" en la app
- [ ] Verificar licenses de modelos específicos descargados

---

## 7. ❌ Mantenibilidad

### Problemas identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Código Java plugins no testeado** | Alta | Alto | Agregar tests unitarios Java |
| **No hay tests de integración** | Alta | Medio | Agregar tests E2E con Espresso |
| **Documentación desactualizada** | Media | Medio | Usar docs-as-code |
| **Dependencies sin updates** | Media | Medio | Configurar Dependabot |
| **No hay CI pipeline** | Alta | Alto | Agregar GitHub Actions |

### Acciones requeridas

- [ ] Agregar GitHub Actions para build automático
- [ ] Configurar Dependabot para updates
- [ ] Agregar tests unitarios para plugins Java
- [ ] Agregar test de humo: build → install → launch

---

## 📊 Score de Riesgo Actual

| Categoría | Score | Estado |
|-----------|-------|--------|
| Build/CI | 7/10 | ⚠️ Mejorable |
| Rendimiento | 6/10 | ⚠️ Riesgo medio |
| Funcionalidad | 5/10 | ❌ Riesgo alto |
| UX/UI | 4/10 | ❌ Riesgo alto |
| Distribución | 5/10 | ❌ Riesgo alto |
| Licencias | 8/10 | ✅ Bien |
| Mantenibilidad | 4/10 | ❌ Riesgo alto |

**Score total: 5.6/10** — Proyecto viable pero requiere trabajo

---

## 🎯 Top 5 Prioridades Inmediatas

1. **Runtime permissions para micrófono** — Sin esto, la app no funciona en Android 6+
2. **Manejo de errores y fallbacks** — Que la app no crashée silenciosamente
3. **Testear en dispositivo físico** — Verificar memoria y performance real
4. **GitHub Actions CI** — Build automático en cada push
5. **Release signing documentado** — Para distribuir fuera de debug

---

## ✅ Checklist de Supervivencia

```
[ ] Permissions runtime (RECORD_AUDIO) implementado
[ ] Fallback TTS: Android → Piper
[ ] Fallback STT: Vosk → Android nativo
[ ] Memory monitoring en debug
[ ] Test en dispositivo 2GB RAM
[ ] GitHub Actions workflow
[ ] Release keystore documentado
[ ] ABOUT.md con attributions
[ ] CHANGELOG.md
[ ] Tests unitarios básicos
```

---

## 🔮 Predicción

**Si no se abordan los riesgos críticos en 30 días:**
- 80% probabilidad de crash en dispositivos gama baja
- 60% probabilidad de rejection en Play Store por permissions
- 40% probabilidad de abandono del proyecto por frustración

**Si se abordan las prioridades:**
- 90% probabilidad de app funcional estable
- 70% probabilidad de adopción en nicho offline-first
- 50% probabilidad de comunidad contribuyendo

---

**Documento vivo — Actualizar con cada milestone**
