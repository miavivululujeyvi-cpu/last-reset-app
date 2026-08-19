'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getConversation, sendMessage, getUsers } from '@/lib/store'
import { Message, User } from '@/lib/types'
import { Send } from 'lucide-react'

export default function CoachMessages() {
  const router = useRouter()
  const [coach, setCoach] = useState<any>(null)
  const [admin, setAdmin] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'coach') { router.replace('/login'); return }
    setCoach(s)
    const adm = getUsers().find(u => u.role === 'admin') || null
    setAdmin(adm)
    if (adm) setMessages(getConversation(s.id, adm.id))
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !coach || !admin) return
    sendMessage(coach.id, admin.id, text.trim())
    setMessages(getConversation(coach.id, admin.id))
    setText('')
  }

  if (!coach) return null

  return (
    <div style={{ marginLeft:'220px', minHeight:'100vh', background:'#0D0D0D', display:'flex', flexDirection:'column' }}>
      <Nav role="coach" />
      <div style={{ padding:'2rem', flex:1, display:'flex', flexDirection:'column', maxWidth:'700px', width:'100%' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:'800', marginBottom:'0.25rem' }}>Messages</h1>
        <p style={{ color:'#888', marginBottom:'1.5rem' }}>Direct line to Coach Jeyvi.</p>

        <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:'500px' }}>
          <div className="card" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1rem', maxHeight:'500px', overflowX:'hidden' }}>
            {messages.length === 0 && (
              <div style={{ color:'#555', textAlign:'center', padding:'2rem' }}>No messages yet. Send a message to Coach Jeyvi.</div>
            )}
            {messages.map(m => {
              const fromMe = m.from_id === coach.id
              return (
                <div key={m.id} style={{ display:'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth:'72%', padding:'0.65rem 1rem', borderRadius: fromMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: fromMe ? '#FFE000' : '#222',
                    color: fromMe ? '#0D0D0D' : '#e5e5e5',
                    fontSize:'0.9rem',
                  }}>
                    {m.content}
                    <div style={{ fontSize:'0.7rem', opacity:0.6, marginTop:'0.25rem', textAlign:'right' }}>
                      {new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} style={{ display:'flex', gap:'0.75rem' }}>
            <input className="input" value={text} onChange={e => setText(e.target.value)}
              placeholder={`Message Coach Jeyvi...`} style={{ flex:1 }} />
            <button className="btn-yellow" type="submit" style={{ padding:'0.6rem 1rem' }}>
              <Send size={16}/>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
