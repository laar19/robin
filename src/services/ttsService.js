export async function initTTS(engine) {
  if (engine === 'android') {
    await Capacitor.Plugins.TtsPlugin.init()
  } else {
    await Capacitor.Plugins.PiperPlugin.init({ modelPath: 'models/es_ES-mls-medium.onnx' })
  }
}

export async function speak(text, engine, lang) {
  if (engine === 'android') {
    await Capacitor.Plugins.TtsPlugin.speak({ text, lang, speed: 1.0 })
  } else {
    await Capacitor.Plugins.PiperPlugin.synthesize({ text })
  }
}
