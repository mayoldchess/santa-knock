// src/lib/speech.js
let voicesCache = []

function loadVoicesOnce() {
  return new Promise((resolve) => {
    const got = () => {
      voicesCache = window.speechSynthesis.getVoices() || []
      resolve(voicesCache)
    }
    const v = window.speechSynthesis.getVoices()
    if (v && v.length) {
      voicesCache = v
      return resolve(voicesCache)
    }
    window.speechSynthesis.onvoiceschanged = got
    const u = new SpeechSynthesisUtterance('')
    window.speechSynthesis.speak(u)
    setTimeout(got, 300)
  })
}

function pickVoice(preferred = []) {
  if (!voicesCache.length) return null
  for (const want of preferred) {
    const found = voicesCache.find(v => v.name.toLowerCase().includes(want.toLowerCase()))
    if (found) return found
  }
  const soft = voicesCache.find(v => /female|child|girl/i.test(v.name)) || voicesCache[0]
  return soft || null
}

export async function say(text, { rate = 1, pitch = 1, lang = 'en-US', voiceList = [] } = {}) {
  try {
    await loadVoicesOnce()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate
    u.pitch = pitch
    u.lang = lang
    const chosen = pickVoice(voiceList)
    if (chosen) u.voice = chosen
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {}
}

export function canListen() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

export function listenOnce({ lang = 'en-US', silenceAsEmpty = true } = {}) {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return reject(new Error('SpeechRecognition not supported'))
    const r = new SR()
    r.lang = lang
    r.interimResults = false
    r.maxAlternatives = 1
    let done = false
    r.onresult = (e) => {
      if (done) return
      done = true
      resolve((e.results[0][0].transcript || '').trim())
    }
    r.onerror = (e) => { if (!done) { done = true; reject(e.error || e) } }
    r.onend = () => { if (!done) { done = true; resolve(silenceAsEmpty ? '' : null) } }
    r.start()
  })
}

// Elf voice with gentle giggles sprinkled in
export function sayElf(text) {
  const sprinkle = Math.random() < 0.5 ? ' Heehee.' : ' Teehee.'
  const line = text.endsWith('!') || text.endsWith('.') ? text + sprinkle : text + '. ' + sprinkle
  return say(line, {
    rate: 1.02,
    pitch: 1.25,
    voiceList: [
      'Google UK English Female',
      'Google US English',
      'Samantha', 'Ava', 'Allison', 'Victoria'
    ]
  })
}
