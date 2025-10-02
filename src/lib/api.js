// src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE || 'https://example.workers.dev'
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5'

async function callChat(system, messages) {
  const r = await fetch(API_BASE + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, system, messages })
  })
  if (!r.ok) {
    const t = await r.text().catch(() => r.statusText)
    throw new Error('Chat error: ' + t)
  }
  // Worker returns { reply }
  const data = await r.json()
  return data.reply || ''
}

export function elfSystem() {
  return [
    'You are Twinkle the Elf, a funny and kind guide for kids.',
    'Tone: warm, playful, short sentences, kid friendly. Keep it safe.',
    'Explain why parent consent matters, in friendly words. No legal jargon.',
    'Collect child first name and age, one at a time. Celebrate success.',
    'No scary stuff. Add a tiny sprinkle of humor or a cute emoji now and then, not too many.',
    'If user is confused, restate the question simply.',
  ].join(' ')
}

export function santaSystem(name, age) {
  return [
    `You are Santa for ${name}, who is ${age}.`,
    'Tone: cheerful, short, cheeky. Ask brief follow ups to build a wishlist.',
    'Keep answers concise. End with a question to continue.',
  ].join(' ')
}

export async function elfChat(history) {
  return callChat(elfSystem(), history)
}

export async function santaChat(history, name, age) {
  return callChat(santaSystem(name, age), history)
}
