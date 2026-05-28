export async function initSTT(engine, lang) {
  const plugin = engine === 'vosk' ? Capacitor.Plugins.VoskPlugin : Capacitor.Plugins.WhisperPlugin
  await plugin.init({ lang })
}

export async function startListening(engine) {
  const plugin = engine === 'vosk' ? Capacitor.Plugins.VoskPlugin : Capacitor.Plugins.WhisperPlugin
  await plugin.startListening()
}

export async function stopListening(engine) {
  const plugin = engine === 'vosk' ? Capacitor.Plugins.VoskPlugin : Capacitor.Plugins.WhisperPlugin
  const result = await plugin.stopListening()
  return result.text || ''
}
