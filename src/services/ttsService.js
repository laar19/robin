import { TtsPlugin, PiperPlugin } from './capacitor-plugins'

export async function initTTS(engine) {
  if (engine === 'android') {
    await TtsPlugin.init()
  } else {
    await PiperPlugin.init({ modelPath: 'models/es_ES-mls-medium.onnx' })
  }
}

export async function speak(text, engine, lang) {
  if (engine === 'android') {
    await TtsPlugin.speak({ text, lang, speed: 1.0 })
  } else {
    await PiperPlugin.synthesize({ text })
  }
}
