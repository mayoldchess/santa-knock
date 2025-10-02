// src/ui/TypingDots.jsx
import React from 'react'
export default function TypingDots({ label = 'Thinking' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#666' }}>
      <span>{label}</span>
      <span style={dotStyle}></span>
      <span style={{ ...dotStyle, animationDelay: '0.15s' }}></span>
      <span style={{ ...dotStyle, animationDelay: '0.3s' }}></span>
      <style>
        {`@keyframes bounce{0%,80%,100%{transform:scale(0.7)}40%{transform:scale(1.0)} }`}
      </style>
    </div>
  )
}
const dotStyle = {
  width: 8, height: 8, borderRadius: '50%',
  background: '#bbb',
  display: 'inline-block',
  animation: 'bounce 1.2s infinite ease-in-out'
}
