import React, { useEffect, useRef, useState } from 'react'
import { sayElf, say, canListen, listenOnce } from '../lib/speech.js'
import { elfChat, santaChat } from '../lib/api.js'
import TypingDots from './TypingDots.jsx'
import jsPDF from 'jspdf'

const Screen = ({ children }) => (
  <div style={{
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    background: 'radial-gradient(circle at 50% 30%, #ffe, #f4faff 70%)',
    overflow: 'hidden'
  }}>{children}</div>
)

const Card = ({ children, max = 560 }) => (
  <div style={{
    width: 'clamp(320px, 92vw, ' + max + 'px)',
    padding: '24px',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,.12)',
    background: '#fff',
    textAlign: 'center',
    position: 'relative'
  }}>{children}</div>
)

const btnStyle = { cursor:'pointer', padding:'14px 18px', borderRadius:'16px', border:'none', background:'#d00000', color:'#fff', fontSize:'16px', fontWeight:700 }
const ghostBtn = { ...btnStyle, background:'#fff', color:'#333', border:'2px solid #ddd' }
const okBtn    = { ...btnStyle, background:'#0a7f2e' }

function Door({ onKnock }) {
  const audioRef = useRef(null)
  const [peek, setPeek] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setPeek(p => !p), 2000)
    return () => clearInterval(t)
  }, [])
  const knock = () => {
    audioRef.current?.play().catch(() => {})
    sayElf("Knock heard. Hello there. Can I peek in?")
    onKnock()
  }
  return (
    <Screen>
      <audio ref={audioRef} src="/santa-knock/knock.mp3" preload="auto" />
      <Card>
        <div style={{ position:'absolute', left: -40, top: 10, transition:'transform .6s',
                      transform: peek ? 'translateX(30px)' : 'translateX(0)' }}>
          <div style={{ fontSize: 40 }}>🧝‍♀️</div>
        </div>
        <div style={{fontSize:'100px', lineHeight:1, marginBottom:12, animation:'jiggle 2s infinite'}}>
          🚪
        </div>
        <h1 style={{ margin:'0 0 12px' }}>Knock knock to enter</h1>
        <p style={{ margin:'0 0 16px', color:'#555' }}>No typing here. Just taps and talking.</p>
        <button onClick={knock} style={btnStyle}>Knock knock</button>
        <style>{`@keyframes jiggle {0%,100%{transform:rotate(0)} 40%{transform:rotate(1.5deg)} 60%{transform:rotate(-1.5deg)} }`}</style>
      </Card>
    </Screen>
  )
}

function MiniTalk({ onContinue }) {
  useEffect(() => {
    sayElf("Hi. I am Twinkle. Lovely day. Any snow outside? I brought cookies.")
    setTimeout(() => sayElf("Before we build the wishlist, I need a quick yes from a parent. Just a tiny tap."), 1200)
  }, [])
  return (
    <Screen>
      <Card>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🧝‍♀️✨</div>
        <h2 style={{ margin: '0 0 10px' }}>Hello there</h2>
        <p style={{ margin: '0 0 16px', color: '#444' }}>
          I make wishes sparkle. First, a grown up taps yes. Then we collect first name and age.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          <button style={okBtn} onClick={onContinue}>Sounds good</button>
          <button style={ghostBtn} onClick={() => sayElf('We can say hello a bit more, then we do the parent tap. Nice and easy.')}>
            Chat a bit more
          </button>
        </div>
      </Card>
    </Screen>
  )
}

function ElfConsent({ onConsent }) {
  const [thinking, setThinking] = useState(false)
  const [text, setText] = useState("I only use first name and age. No addresses. No accounts.")
  const explain = async () => {
    try {
      setThinking(true)
      setText("Let me explain it nicely...")
      // small model line for natural feel
      await new Promise(r => setTimeout(r, 450))
      setText("We ask a parent first, to keep kids safe. Then we use first name and age to make the chat friendly.")
      sayElf("We ask a parent first to keep kids safe. Then we use first name and age to make the chat friendly.")
    } finally {
      setThinking(false)
    }
  }
  useEffect(() => { explain() }, [])
  return (
    <Screen>
      <Card>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🧝‍♀️✨</div>
        <h2 style={{ margin:'0 0 10px' }}>Parent consent</h2>
        <p style={{ margin:'0 0 16px', color:'#444', minHeight: 48 }}>
          {thinking ? <TypingDots label="Explaining" /> : text}
        </p>
        <div style={{ display:'grid', gap:12 }}>
          <button style={btnStyle} onClick={onConsent}>I am the parent. I consent.</button>
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
  const [busy, setBusy] = useState(false)

  const ask = async () => {
    if (!canListen()) { alert('Voice input not supported on this device.'); return }
    setBusy(true)
    sayElf("Parent, please say the child's first name.")
    const n = await listenOnce().catch(() => '')
    if (n) setName(n)
    sayElf("Now say the age in years.")
    const a = await listenOnce().catch(() => '')
    if (a) setAge(a.replace(/\D/g, ''))
    setBusy(false)
    if (n && a) sayElf(`Lovely. Hello ${n}. Age ${a}. Let us visit Santa.`)
  }

  useEffect(() => { const t = setTimeout(() => ask(), 500); return () => clearTimeout(t) }, [])

  return (
    <Screen>
      <Card>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎤</div>
        <h2 style={{ margin:'0 0 10px' }}>Tell me the name and age</h2>
        <div style={{ display:'grid', gap:8, margin:'12px 0', color:'#333' }}>
          <div>Child name: <b>{name || '...'}</b></div>
          <div>Age: <b>{age || '...'}</b></div>
        </div>
        <div style={{ display:'grid', gap:12 }}>
          <button style={btnStyle} onClick={ask} disabled={busy}>{busy ? 'Listening...' : 'Start mic again'}</button>
          <button style={okBtn} onClick={() => onDone({ name, age })} disabled={!name || !age}>Looks good</button>
        </div>
      </Card>
    </Screen>
  )
}

function WishlistPanel({ items, onExport }) {
  return (
    <div style={{
      position:'absolute', right:-8, top:-8, width:260,
      padding:'16px', borderRadius:'20px', background:'#fff',
      boxShadow:'0 6px 20px rgba(0,0,0,.10)', textAlign:'left'
    }}>
      <h3 style={{margin:'0 0 8px'}}>Wishlist 🎁</h3>
      <ul style={{margin:0, paddingLeft: '18px'}}>
        {items.length === 0 ? <li>Empty for now</li> :
          items.map((w,i) => <li key={i}>{w}</li>)
        }
      </ul>
      <button style={{...ghostBtn, marginTop:12}} onClick={onExport}>Export PDF</button>
    </div>
  )
}

function SantaChat({ name, age }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Ho ho ho. Hello ${name}! Twinkle says you are ${age}. Tell me a wish. I make lists like a pro.` }
  ])
  const [thinking, setThinking] = useState(false)
  const [wishlist, setWishlist] = useState([])

  useEffect(() => { say(messages[0].content) }, [])

  const addToListIfFound = (line) => {
    // naive grab, model usually replies with clear phrases
    const wishMatches = line.match(/(?:wish|would like|i want|i would love)\s+(.*?)(?:\.|$)/i)
    if (wishMatches && wishMatches[1]) {
      const item = wishMatches[1].trim()
      if (item && !wishlist.includes(item)) setWishlist(w => [...w, item])
    }
  }

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
      addToListIfFound(utter)
      addToListIfFound(santa)
      say(santa)
    } catch {
      const err = 'Santa had a cocoa spill. Try again.'
      setMessages([...next, { role: 'assistant', content: err }])
      say(err)
    } finally {
      setThinking(false)
    }
  }

  const exportPdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Wishlist', 20, 20)
    doc.setFontSize(12)
    doc.text(`Child: ${name}, Age: ${age}`, 20, 30)
    let y = 42
    if (wishlist.length === 0) {
      doc.text('No items yet.', 20, y)
    } else {
      wishlist.forEach((w, i) => {
        doc.text(`${i + 1}. ${w}`, 20, y)
        y += 8
      })
    }
    doc.save(`wishlist-${name || 'kid'}.pdf`)
  }

  return (
    <Screen>
      <Card max={820}>
        <div style={{ fontSize:'48px', animation:'sway 3s ease-in-out infinite' }}>🎅✨</div>
        <h2 style={{ margin:'6px 0 12px' }}>Chat with Santa</h2>
        <div style={{
          height: 300, overflow:'auto', textAlign:'left', padding: 12,
          border: '1px solid #eee', borderRadius: 12, background:'#fafafa', marginBottom: 12
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{ margin:'8px 0' }}>
              <b>{m.role === 'assistant' ? 'Santa' : 'You'}:</b> {m.content}
            </div>
          ))}
          {thinking && <div style={{ marginTop: 6 }}><TypingDots label="Santa is thinking" /></div>}
        </div>
        <div style={{ display:'grid', gap:8 }}>
          <button style={btnStyle} onClick={speakTurn}>Tap to speak</button>
          <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Voice only.</p>
        </div>
        <WishlistPanel items={wishlist} onExport={exportPdf} />
        <style>{`@keyframes sway {0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }`}</style>
      </Card>
    </Screen>
  )
}

export default function App() {
  const [step, setStep] = useState('door')
  const [kid, setKid] = useState({ name: '', age: '' })

  if (step === 'door')     return <Door onKnock={() => setStep('minitalk')} />
  if (step === 'minitalk') return <MiniTalk onContinue={() => setStep('consent')} />
  if (step === 'consent')  return <ElfConsent onConsent={() => setStep('nameage')} />
  if (step === 'nameage')  return <ElfCollectNameAge onDone={({ name, age }) => { setKid({ name, age }); setStep('chat') }} />
  if (step === 'chat')     return <SantaChat name={kid.name} age={kid.age} />
  return null
}
