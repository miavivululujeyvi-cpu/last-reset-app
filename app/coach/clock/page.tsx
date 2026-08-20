'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getClientsForCoach, clockIn, clockOut, getActiveClockEntry, getClockEntries } from '@/lib/store'
import { User, ClockEntry } from '@/lib/types'
import { Clock, Play, Square } from 'lucide-react'

export default function CoachClock() {
  const router = useRouter()
  const [coach, setCoach] = useState<any>(null)
  const [clients, setClients] = useState<User[]>([])
  const [active, setActive] = useState<ClockEntry | undefined>()
  const [elapsed, setElapsed] = useState(0)
  const [history, setHistory] = useState<ClockEntry[]>([])
  const [clientMap, setClientMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'coach') { router.replace('/login'); return }
    setCoach(s)
    const cls = getClientsForCoach(s.id)
    setClients(cls)
    setClientMap(Object.fromEntries(cls.map(c => [c.id, c.name])))
    const a = getActiveClockEntry(s.id)
    setActive(a)
    refreshHistory(s.id)
  }, [router])

  function refreshHistory(coachId: string) {
    const all = getClockEntries().filter(e => e.coach_id === coachId && e.clock_out).sort((a, b) => b.clock_in.localeCompare(a.clock_in))
    setHistory(all)
  }

  useEffect(() => {
    if (!active) { setElapsed(0); return }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(active.clock_in).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [active])

  function handleClockIn(clientId: string) {
    if (!coach) return
    const entry = clockIn(coach.id, clientId)
    setActive(entry)
  }

  function handleClockOut() {
    if (!active || !coach) return
    clockOut(active.id)
    setActive(undefined)
    refreshHistory(coach.id)
  }

  function fmt(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`
  }

  if (!coach) return null

  const totalMinutes = history.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)

  return (
    <div className="page-main">
      <Nav role="coach" />
      <div style={{ padding:'2rem', maxWidth:'700px' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>Clock In / Out</h1>
        <p style={{ color:'#888', marginBottom:'2rem' }}>Track your time with each client.</p>

        {/* Active session */}
        {active ? (
          <div className="card" style={{ marginBottom:'1.5rem', borderColor:'#FFE000', background:'rgba(255,224,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
              <Clock size={20} style={{ color:'#FFE000' }}/>
              <span style={{ fontWeight:'700', color:'#FFE000' }}>Session Active</span>
              <span className="badge badge-yellow">LIVE</span>
            </div>
            <div style={{ fontSize:'3rem', fontWeight:'800', color:'#FFE000', marginBottom:'0.5rem', fontFamily:'monospace' }}>
              {fmt(elapsed)}
            </div>
            <div style={{ fontSize:'0.9rem', color:'#888', marginBottom:'1.25rem' }}>
              Client: <strong style={{ color:'#e5e5e5' }}>{clientMap[active.client_id] || 'Unknown'}</strong>
            </div>
            <button className="btn-ghost" onClick={handleClockOut}
              style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'#f87171', borderColor:'#f87171' }}>
              <Square size={14}/> Clock Out
            </button>
          </div>
        ) : (
          <div className="card" style={{ marginBottom:'1.5rem' }}>
            <h2 style={{ fontWeight:'700', fontSize:'0.95rem', marginBottom:'1rem' }}>Start a Session</h2>
            {clients.length === 0
              ? <p style={{ color:'#666' }}>No clients assigned.</p>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {clients.map(c => (
                    <button key={c.id} onClick={() => handleClockIn(c.id)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1rem', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:'8px', cursor:'pointer', color:'#e5e5e5' }}>
                      <span style={{ fontWeight:'600' }}>{c.name}</span>
                      <span style={{ display:'flex', alignItems:'center', gap:'0.4rem', color:'#FFE000', fontSize:'0.85rem', fontWeight:'700' }}>
                        <Play size={14}/> Start
                      </span>
                    </button>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.8rem', fontWeight:'800', color:'#FFE000' }}>{history.length}</div>
            <div style={{ fontSize:'0.8rem', color:'#888' }}>Total sessions</div>
          </div>
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.8rem', fontWeight:'800', color:'#FFE000' }}>{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</div>
            <div style={{ fontSize:'0.8rem', color:'#888' }}>Total hours logged</div>
          </div>
        </div>

        {/* History */}
        <div className="card">
          <h2 style={{ fontWeight:'700', fontSize:'0.95rem', marginBottom:'1rem' }}>Session History</h2>
          {history.length === 0
            ? <p style={{ color:'#666', fontSize:'0.9rem' }}>No completed sessions yet.</p>
            : history.slice(0, 10).map(e => (
              <div key={e.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0', borderBottom:'1px solid #1a1a1a', fontSize:'0.88rem' }}>
                <div>
                  <div style={{ fontWeight:'600' }}>{clientMap[e.client_id] || 'Client'}</div>
                  <div style={{ color:'#555', fontSize:'0.78rem' }}>{new Date(e.clock_in).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:'#FFE000', fontWeight:'700' }}>{e.duration_minutes}m</div>
                  <div style={{ color:'#555', fontSize:'0.78rem' }}>{new Date(e.clock_in).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
