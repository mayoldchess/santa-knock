export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    if (url.pathname === '/chat' && req.method === 'POST') {
      try {
        const body = await req.json()
        const { model, system, messages } = body

        const payload = {
          model: model || 'gpt-5',
          messages: [
            { role: 'system', content: system || 'You are Santa.' },
            ...(messages || [])
          ]
        }

        const r = await fetch(`${env.OPENAI_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify(payload)
        })

        if (!r.ok) {
          return new Response(await r.text(), { status: r.status })
        }
        const data = await r.json()
        const reply = data.choices?.[0]?.message?.content ?? ''
        return Response.json({ reply })
      } catch (e) {
        return new Response('Bad request', { status: 400 })
      }
    }
    return new Response('OK', { status: 200 })
  }
}
