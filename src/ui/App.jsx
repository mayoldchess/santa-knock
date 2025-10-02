// src/ui/App.jsx
import React, { useEffect, useRef, useState } from 'react'
import { sayElf, say, canListen, listenOnce } from '../lib/speech.js'
import { elfChat, santaChat } from '../lib/api.js'

const Screen = ({ children }) => (
  <div style={{
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    background: 'radial-gradient(circle at 50% 30%, #ffe, #f4faff 70%)'
  }}>{children}</div>
)

const Card = ({ children, max = 560 }) => (
  <div style={{
    width: 'clamp(300px, 90vw, ' + max + 'px)',
    padding: '24px',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,.12)',
    background: '#fff',
    textAlign: 'center'
  }}>{children}</div>
)

const btnStyle = {
  cursor: 'pointer',
  padding: '14px 18px',
  borderRadius: '16px',
  border: 'none',
  background: '#d00000',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 700
}
const ghostBtn = { ...btnStyle, background: '#fff', color: '#333', border: '2px solid #ddd' }
const okBtn = { ...btnStyle, background: '#0a7f2e' }

function Door({ onKnock }) {
  const audioRef = useRef(null)
  const knock = () => {
    audioRef.current?.play().catch(() => {})
    onKnock()
  }
  return (
    <Screen>
      <audio ref={audioRef} src="/santa-knock/knock.mp3" preload="auto" />
      <Card>
        <div style={{ fontSize: '84px', lineHeight: 1, marginBottom: 12 }}>🚪</div>
        <h1 style={{ margin: '0 0 12px' }}>Knock knock to enter</h1>
        <p style={{ margin: '0 0 16px', color: '#555' }}>No typing here. Just taps and talking.</p>
        <button onClick={knock} style={btnStyle}>Knock knock</button>
      </Card>
    </Screen>
  )
}

function ElfConsent({ onConsent }) {
  const [lines, setLines] = useState([
    { role: 'system', content: '' },
    { role: 'assistant', content: 'Hi. I am Twinkle, Santa’s friendly consent elf. Can I talk to a parent for a quick yes, please?' }
  ])

  useEffect(() => {
    sayElf('Hi. I am Twinkle, Santa’s friendly consent elf. Can I talk to a parent for a quick yes, please?')
  }, [])

  return (
    <Screen>
      <Card>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🧝‍♀️✨</div>
        <h2 style={{ margin: '0 0 10px' }}>Parent consent</h2>
        <p style={{ margin: '0 0 16px', color: '#444' }}>
          We only use first name and age to personalize the chat and wishlist. No accounts. No addresses.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          <button
            style={btnStyle}
            onClick={() => { onConsent() }}>
            I am the parent. I consent.
          </button>
          <button style={ghostBtn} onClick={() => sayElf('A parent needs to press the consent button. Thank you.')}>
            I am a kid. I need a parent.
          </button>
        </div>
      </Card>
    </Screen>
  )
}

function ElfCollectNameAge({ onDone }) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [history, setHistory] = useState([{ role: 'system', content: '' }])
  const [busy, setBusy] = useState(false)

  async function ask(prompt) {
    setBusy(true)
    const next = [...history, { role: 'assistant', content: prompt }]
    setHistory(next)
    sayElf(prompt)
    const heard = await listenOnce().catch(() => '')
    const userLine = heard || ''
    const withUser = [...next, { role: 'user', content: userLine }]
    setHistory(withUser)
    setBusy(false)
    return userLine
  }

  useEffect(() => {
    const run = async () => {
      // Ask name
      const first = await ask('Parent, please say the child’s first name.')
      if (first) setName(first)

      // Ask age
      const saidAge = await ask('Now say the age in years.')
      if (saidAge) setAge(saidAge.replace(/\D/g, ''))

      // Cute confirmation from the Elf
      const convo = [
        ...history,
        { role: 'assistant', content: `Got it. Name: ${first || '(not heard)'}; Age: ${saidAge || '(not heard)'}.\nMake a short cheerful confirmation for the kid. Then invite them to meet Santa.` }
      ]
      try {
        const reply = await elfChat(convo)
        if (reply) sayElf(reply)
      } catch {
        sayElf('All set. Let us visit Santa now.')
      }
    }
    // Delay a tick so the TTS does not clip
    const t = setTimeout(run, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Screen>
      <Card>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎤</div>
        <h2 style={{ margin: '0 0 10px' }}>Tell me the name and age</h2>
        <div style={{ display: 'grid', gap: 8, margin: '12px 0', color: '#333' }}>
          <div>Child name: <b>{name || '...'}</b></div>
          <div>Age: <b>{age || '...'}</b></div>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <button style={btnStyle} disabled={busy} onClick={async () => {
            const n = await listenOnce().catch(() => '')
            if (n) setName(n)
          }}>Say name again</button>
          <button style={btnStyle} disabled={busy} onClick={async () => {
            const a = await listenOnce().catch(() => '')
            if (a) setAge(a.replace(/\D/g, ''))
          }}>Say age again</button>
          <button style={okBtn} disabled={!name || !age} onClick={() => onDone({ name, age })}>Looks good</button>
        </div>
      </Card>
    </Screen>
  )
}

function SantaChat({ name, age }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Ho ho ho. Hello ${name}! Twinkle says you are ${age}. Tell me a wish. I make lists like a pro.` }
  ])
  const [thinking, setThinking] = useState(false)

  useEffect(() => { say(messages[0].content) }, []) // first line out loud

  async function speakTurn() {
    if (!canListen()) { alert('Voice not supported on this device.'); return }
    const utter = await listenOnce().catch(() => '')
    if (!utter) return
    const next = [...messages, { role: 'user', content: utter }]
    setMessages(next)
    setThinking(true)
    try {
      const reply = await santaChat(next, name, age)
      const santa = reply || 'Ho ho ho!'
      setMessages([...next, { role: 'assistant', content: santa }])
      say(santa)
    } catch {
      const err = 'Santa had a cocoa spill. Try again.'
      setMessages([...next, { role: 'assistant', content: err }])
      say(err)
    } finally {
      setThinking(false)
    }
  }

  return (
    <Screen>
      <Card max={720}>
        <div style={{ fontSize: '48px' }}>🎅✨</div>
        <h2 style={{ margin: '6px 0 12px' }}>Chat with Santa</h2>
        <div style={{
          height: 300, overflow: 'auto', textAlign: 'left', padding: 12,
          border: '1px solid #eee', borderRadius: 12, background: '#fafafa', marginBottom: 12
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{ margin: '8px 0' }}>
              <b>{m.role === 'assistant' ? 'Santa' : 'You'}:</b> {m.content}
            </div>
          ))}
          {thinking && <div><i>Santa is thinking...</i></div>}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button style={btnStyle} onClick={speakTurn}>Tap to speak</button>
          <p style={{ fontSize: 12, color: '#666', margin: 0 }}>No text input. Voice only.</p>
        </div>
      </Card>
    </Screen>
  )
}

export default function App() {
  const [step, setStep] = useState('door')
  const [kid, setKid] = useState({ name: '', age: '' })

  if (step === 'door') return <Door onKnock={() => setStep('consent')} />
  if (step === 'consent') return <ElfConsent onConsent={() => setStep('nameage')} />
  if (step === 'nameage') return <ElfCollectNameAge onDone={({ name, age }) => { setKid({ name, age }); setStep('chat') }} />
  if (step === 'chat') return <SantaChat name={kid.name} age={kid.age} />
  return null
}
