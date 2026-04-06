import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/^http/, 'ws')

export default function ChatBox({ orderId, disabled = false }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!orderId || disabled) return

    // Load history via REST first
    api.get(`/chat/history/${orderId}`).then(res => {
      setMessages(res.data.map(m => ({ ...m, type: 'message' })))
    }).catch(() => {})

    // Connect WebSocket
    const ws = new WebSocket(`${WS_URL}/chat/ws/${orderId}/${user.id}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.data])
      }
    }

    return () => ws.close()
  }, [orderId, disabled])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim() || !connected) return
    wsRef.current?.send(input.trim())
    setInput('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (disabled) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        💬 Chat is disabled after order completion
      </div>
    )
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card2)' }}>
        <span style={{ fontSize: '1rem' }}>💬</span>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chat</span>
        <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--success)' : 'var(--danger)' }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{connected ? 'Connected' : 'Offline'}</span>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2rem' }}>
            No messages yet. Say hi! 👋
          </p>
        )}
        {messages.map((msg, i) => {
          const mine = msg.sender_id === user?.id
          return (
            <div key={i} className={`chat-bubble ${mine ? 'chat-bubble-mine' : 'chat-bubble-other'}`}>
              {msg.content}
              <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 4 }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <input
          className="input"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary btn-sm" onClick={send} disabled={!connected}>
          Send ➤
        </button>
      </div>
    </div>
  )
}
