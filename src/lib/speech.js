export function say(text){
  try{
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1; u.pitch = 1; u.lang = 'en-US'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }catch{}
}
export function canListen(){
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}
export function listenOnce({lang='en-US'} = {}){
  return new Promise((resolve,reject)=>{
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if(!SR) return reject(new Error('SpeechRecognition not supported'))
    const r = new SR()
    r.lang = lang; r.interimResults = false; r.maxAlternatives = 1
    let done = false
    r.onresult = (e)=>{ if(done) return; done = true; resolve(e.results[0][0].transcript.trim()) }
    r.onerror = (e)=>{ if(!done){ done = true; reject(e.error || e) } }
    r.onend = ()=>{ if(!done){ done = true; resolve('') } }
    r.start()
  })
}
