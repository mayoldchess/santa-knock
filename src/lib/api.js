const API_BASE = import.meta.env.VITE_API_BASE || 'https://example.workers.dev'
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5'
export async function santaChat(system, messages){
  const r = await fetch(API_BASE + '/chat', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ model: MODEL, system, messages })
  })
  if(!r.ok){
    const t = await r.text().catch(()=>r.statusText)
    throw new Error('Chat error: ' + t)
  }
  return r.json()
}
