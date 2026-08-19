'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import {
  getSession, getCheckInsForClient, getWorkoutsForClient,
  getAIMessages, saveAIMessage, clearAIMessages
} from '@/lib/store'
import { AIMessage } from '@/lib/types'
import { Send, Bot, RotateCcw, Zap } from 'lucide-react'

const QUICK_PROMPTS = [
  "I just woke up. What should I do first?",
  "I'm struggling with cravings. Help.",
  "I completed my workout today!",
  "What can I eat for breakfast?",
  "I skipped my workout. Be honest with me.",
  "How am I doing this week?",
]

export default function AICoachPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientData, setClientData] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    // Only AI plan clients — or any client for now (admin can grant access)
    setUser(s)
    const checkins = getCheckInsForClient(s.id)
    const workouts = getWorkoutsForClient(s.id)
    const today = new Date().toISOString().split('T')[0]
    setClientData({
      name: s.name,
      checkins,
      workouts,
      todayCheckin: checkins.find(c => c.date === today) || null,
      todayWorkout: workouts.find(w => w.date === today) || null,
    })
    const saved = getAIMessages(s.id)
    if (saved.length > 0) {
      setMessages(saved)
    } else {
      // Opening greeting from AI
      const greeting: AIMessage = {
        role: 'assistant',
        content: `Hey ${s.name}! I'm your AI coach. I have access to your weight history and check-ins, so I can give you real feedback. Not generic advice.\n\nWhat's going on today? Did you weigh in this morning?`,
        created_at: new Date().toISOString(),
      }
      setMessages([greeting])
      saveAIMessage(s.id, greeting)
    }
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading || !user || !clientData) return
    setInput('')

    const userMsg: AIMessage = { role: 'user', content: text.trim(), created_at: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    saveAIMessage(user.id, userMsg)
    setLoading(true)

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          clientData,
        }),
      })
      const data = await res.json()
      const aiMsg: AIMessage = { role: 'assistant', content: data.content, created_at: new Date().toISOString() }
      setMessages(prev => [...prev, aiMsg])
      saveAIMessage(user.id, aiMsg)
    } catch {
      const errMsg: AIMessage = { role: 'assistant', content: "Connection issue. Try again.", created_at: new Date().toISOString() }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleClear() {
    if (!user) return
    clearAIMessages(user.id)
    const greeting: AIMessage = {
      role: 'assistant',
      content: `Fresh start, ${user.name}! What's on your mind?`,
      created_at: new Date().toISOString(),
    }
    setMessages([greeting])
    saveAIMessage(user.id, greeting)
  }

  if (!user) return null

  const todayChecked = !!clientData?.todayCheckin
  const todayWorkedOut = !!clientData?.todayWorkout

  return (
    <div style={{ marginLeft: '220px', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0D0D0D' }}>
      <Nav role="client" />

      {/* Header */}
      <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,224,0,0.1)', border: '2px solid #FFE000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} style={{ color: '#FFE000' }} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem' }}>AI Coach</div>
            <div style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Online — powered by The Last Reset Program
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Daily status pills */}
          <span className={`badge badge-${todayChecked ? 'green' : 'red'}`}>
            {todayChecked ? 'Checked in' : 'No check-in today'}
          </span>
          <span className={`badge badge-${todayWorkedOut ? 'green' : 'gray'}`}>
            {todayWorkedOut ? 'Workout done' : 'No workout yet'}
          </span>
          <button onClick={handleClear}
            style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
            <RotateCcw size={13} /> New chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.6rem' }}>
            {m.role === 'assistant' && (
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,224,0,0.1)', border: '1px solid #FFE000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={14} style={{ color: '#FFE000' }} />
              </div>
            )}
            <div style={{
              maxWidth: '72%',
              padding: '0.75rem 1rem',
              borderRadius: m.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
              background: m.role === 'user' ? '#FFE000' : '#1e1e1e',
              color: m.role === 'user' ? '#0D0D0D' : '#e5e5e5',
              fontSize: '0.93rem',
              lineHeight: '1.55',
              whiteSpace: 'pre-wrap',
              border: m.role === 'assistant' ? '1px solid #2a2a2a' : 'none',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,224,0,0.1)', border: '1px solid #FFE000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={14} style={{ color: '#FFE000' }} />
            </div>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 2px', background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FFE000', opacity: 0.6, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 2rem 0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)}
              style={{ background: 'rgba(255,224,0,0.06)', border: '1px solid #2a2a1a', borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
              <Zap size={11} style={{ color: '#FFE000' }} /> {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '1rem 2rem 1.5rem', borderTop: '1px solid #1a1a1a', flexShrink: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Talk to your AI coach..."
            disabled={loading}
            style={{ flex: 1 }}
            autoFocus
          />
          <button className="btn-yellow" type="submit" disabled={!input.trim() || loading}
            style={{ padding: '0.6rem 1.1rem', opacity: !input.trim() || loading ? 0.5 : 1 }}>
            <Send size={16} />
          </button>
        </form>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
