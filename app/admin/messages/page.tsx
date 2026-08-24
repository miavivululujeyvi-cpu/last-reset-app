'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getCoaches, getConversation, sendMessage } from '@/lib/store'
import { Message, User } from '@/lib/types'
import { Send } from 'lucide-react'

export default function AdminMessages() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [coaches, setCoaches] = useState<User[]>([])
  const [selected, setSelected] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'admin') { router.replace('/login'); return }
    setAdmin(s)
    const chs = getCoaches()
    setCoaches(chs)
    if (chs.length > 0) { setSelected(chs[0]); loadConv(s, chs[0]) }
  }, [router])

  function loadConv(adm: any, coach: User) {
    setMessages(getConversation(adm.id, coach.id))
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  function selectCoach(coach: User) {
    setSelected(coach)
    if (admin) loadConv(admin, coach)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !admin || !selected) return
    sendMessage(admin.id, selected.id, text.trim())
    loadConv(admin, selected)
    setText('')
  }

  if (!admin) return null

  return (
    <div className="page-main">
      <Nav role="admin" />
      <div style={{ padding:'2rem', maxWidth:'900px' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>Messages</h1>
        <p style={{ color:'#888', marginBottom:'1.5rem' }}>Communicate with your coaches.</p>

        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:'1rem', height:'540px' }}>
          {/* Coach list */}
          <div className="card" style={{ overflowY:'auto', padding:'0.5rem' }}>
            <p style={{ fontSize:'0.72rem', color:'#555', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.08em', padding:'0.5rem 0.75rem 0.75rem' }}>Coaches</p>
            {coaches.map(c => (
              <button key={c.id} onClick={() => selectCoach(c)}
                style={{ display:'block', width:'100%', textAlign:'left', padding:'0.65rem 0.75rem', borderRadius:'6px', border:'none', cursor:'pointer', marginBottom:'0.2rem',
                  background: selected?.id === c.id ? 'rgba(255,224,0,0.1)' : 'transparent',
                  color: selected?.id === c.id ? '#FFE000' : '#aaa',
                  fontWeight: selected?.id === c.id ? '600' : '400', fontSize:'0.9rem' }}>
                {c.name}
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div className="card" style={{ display:'flex', flexDirection:'column', padding:'1rem' }}>
            {selected ? (
              <>
                <div style={{ borderBottom:'1px solid #E2E4EC', paddingBottom:'0.75rem', marginBottom:'0.75rem', fontWeight:'700', fontSize:'0.95rem' }}>
                  {selected.name}
                </div>
                <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.6rem', marginBottom:'0.75rem' }}>
                  {messages.length === 0 && (
                    <div style={{ color:'#555', textAlign:'center', padding:'2rem', fontSize:'0.9rem' }}>
                      No messages with {selected.name} yet.
                    </div>
                  )}
                  {messages.map(m => {
                    const fromMe = m.from_id === admin.id
                    return (
                      <div key={m.id} style={{ display:'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth:'70%', padding:'0.6rem 0.9rem', borderRadius: fromMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                          background: fromMe ? '#FFE000' : '#F3F4F9',
                          color: '#1A1A1A', fontSize:'0.88rem',
                        }}>
                          {m.content}
                          <div style={{ fontSize:'0.68rem', opacity:0.5, marginTop:'0.2rem', textAlign:'right' }}>
                            {new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef}/>
                </div>
                <form onSubmit={handleSend} style={{ display:'flex', gap:'0.5rem' }}>
                  <input className="input" value={text} onChange={e => setText(e.target.value)}
                    placeholder={`Message ${selected.name}...`} style={{ flex:1 }} />
                  <button className="btn-yellow" type="submit" style={{ padding:'0.6rem 1rem' }}>
                    <Send size={16}/>
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>
                Select a coach to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
