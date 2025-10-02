import React, { useEffect, useRef, useState } from 'react'
import { say, canListen, listenOnce } from '../lib/speech.js'
import { store } from '../lib/store.js'
import { santaChat } from '../lib/api.js'

const Screen = ({children}) => (
  <div style={{height:'100%', display:'grid', placeItems:'center',
    background:'radial-gradient(circle at 50% 30%, #ffe, #f4faff 70%)'}}>{children}</div>
)
const Card = ({children, max=560}) => (
  <div style={{width:'clamp(300px, 90vw, '+max+'px)', padding:'24px',
    borderRadius:'24px', boxShadow:'0 10px 30px rgba(0,0,0,.12)', background:'#fff', textAlign:'center'}}>{children}</div>
)

function Door({onKnock}){
  const audioRef = useRef(null)
  const knock = ()=>{ audioRef.current?.play().catch(()=>{}); onKnock() }
  return (
    <Screen>
      <audio ref={audioRef} src="/santa-knock/knock.mp3" preload="auto" />
      <Card>
        <div style={{fontSize:'84px', lineHeight:1, marginBottom:12}}>🚪</div>
        <h1 style={{margin:'0 0 12px'}}>Knock knock to enter</h1>
        <p style={{margin:'0 0 16px', color:'#555'}}>No typing here. Just taps and talking.</p>
        <button onClick={knock} style={btnStyle}>Knock knock</button>
      </Card>
    </Screen>
  )
}
function Consent({onContinue}){
  useEffect(()=>{ say("Hi. I am Twinkle, Santa's compliance elf. I need a grown up to say yes. We ask for first name and age to keep it safe and magical.") },[])
  return (
    <Screen>
      <Card>
        <div style={{fontSize:'64px', marginBottom:8}}>🧝‍♀️✨</div>
        <h2 style={{margin:'0 0 10px'}}>Parent consent</h2>
        <p style={{margin:'0 0 16px', color:'#444'}}>We collect the child's first name and age to personalize the chat and the wishlist. No addresses. No accounts. Your approval is required.</p>
        <div style={{display:'grid', gap:12}}>
          <button style={btnStyle} onClick={()=>{ store.parentConsented = true; onContinue(); }}>I am the parent. I consent.</button>
          <button style={ghostBtn} onClick={()=> say("A parent needs to press the consent button.")}>I am a kid. I need a parent.</button>
        </div>
      </Card>
    </Screen>
  )
}
function NameAge({onDone}){
  const [name,setName] = useState(''); const [age,setAge] = useState(''); const [listening, setListening] = useState(false)
  const ask = async()=>{
    if(!canListen()){ alert('Voice input not supported on this device.'); return }
    setListening(true)
    say("Parent, please say the child's first name."); const n = await listenOnce().catch(()=> '')
    if(n) setName(n)
    say("Now say the age in years."); const a = await listenOnce().catch(()=> '')
    if(a) setAge(a.replace(/\D/g,''))
    setListening(false)
  }
  const go = ()=>{
    if(!name || !age){ say("We need name and age first."); return }
    store.childName = name; store.childAge = age; onDone()
  }
  useEffect(()=>{ setTimeout(()=> ask(), 600) },[])
  return (
    <Screen>
      <Card>
        <div style={{fontSize:'48px', marginBottom:8}}>🎤</div>
        <h2 style={{margin:'0 0 10px'}}>Say the name and age</h2>
        <p style={{margin:'0 0 16px', color:'#444'}}>Tap start if the mic prompt did not appear.</p>
        <div style={{display:'grid', gap:8, margin:'12px 0', color:'#333'}}>
          <div>Child name: <b>{name || '...'}</b></div>
          <div>Age: <b>{age || '...'}</b></div>
        </div>
        <div style={{display:'grid', gap:12}}>
          <button style={btnStyle} onClick={ask} disabled={listening}>{listening ? 'Listening...' : 'Start mic again'}</button>
          <button style={okBtn} onClick={go}>Looks good</button>
        </div>
      </Card>
    </Screen>
  )
}
function ChatSanta(){
  const [messages, setMessages] = useState([{role:'assistant', content:`Ho ho ho. Hello ${store.childName}! Twinkle told me you are ${store.childAge}. Tell me your wishes. I can build a magical wishlist.`}])
  const [thinking, setThinking] = useState(false)
  const askByVoice = async()=>{
    if(!canListen()){ alert('Voice not supported.'); return }
    const utter = await listenOnce().catch(()=> ''); if(!utter) return
    const next = [...messages, {role:'user', content: utter}]
    setMessages(next); setThinking(true)
    try{
      const system = `You are Santa. Funny. Kind. Cheeky. Keep it short for kids. Ask questions to build a wishlist.`
      const res = await santaChat(system, next)
      const santa = res.reply || res.choices?.[0]?.message?.content || 'Ho ho ho!'
      setMessages([...next, {role:'assistant', content: santa}]); say(santa)
    }catch(e){
      const err = 'Santa had a cocoa spill. Try again.'
      setMessages([...next, {role:'assistant', content: err}]); say(err)
    }finally{ setThinking(false) }
  }
  return (
    <Screen>
      <Card max={720}>
        <div style={{fontSize:'48px'}}>🎅✨</div>
        <h2 style={{margin:'6px 0 12px'}}>Chat with Santa</h2>
        <div style={{height:280, overflow:'auto', textAlign:'left', padding:'12px', border:'1px solid #eee', borderRadius:12, background:'#fafafa', marginBottom:12}}>
          {messages.map((m,i)=>(<div key={i} style={{margin:'8px 0'}}><b>{m.role==='assistant' ? 'Santa' : 'You'}:</b> {m.content}</div>))}
          {thinking && <div><i>Santa is thinking...</i></div>}
        </div>
        <div style={{display:'grid', gap:8}}>
          <button style={btnStyle} onClick={askByVoice}>Tap to speak</button>
          <p style={{fontSize:12, color:'#666', margin:0}}>No text input. Voice only.</p>
        </div>
      </Card>
    </Screen>
  )
}
export default function App(){
  const [step,setStep] = useState('door')
  if(step==='door') return <Door onKnock={()=> setStep('consent')} />
  if(step==='consent'){ if(!store.parentConsented) return <Consent onContinue={()=> setStep('nameage')} />; return <Consent onContinue={()=> setStep('nameage')} /> }
  if(step==='nameage') return <NameAge onDone={()=> setStep('chat')} />
  if(step==='chat') return <ChatSanta />
  return null
}
const btnStyle = { cursor:'pointer', padding:'14px 18px', borderRadius:'16px', border:'none', background:'#d00000', color:'#fff', fontSize:'16px', fontWeight:700 }
const ghostBtn = { ...btnStyle, background:'#fff', color:'#333', border:'2px solid #ddd' }
const okBtn = { ...btnStyle, background:'#0a7f2e' }
