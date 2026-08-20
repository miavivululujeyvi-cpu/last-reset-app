'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getClientsForCoach, getCheckInsForClient } from '@/lib/store'
import { User, CheckIn } from '@/lib/types'

type ClientRow = { client: User; lastCheckin: CheckIn | undefined; pending: number }

export default function CoachDashboard() {
  const router = useRouter()
  const [coach, setCoach] = useState<any>(null)
  const [rows, setRows] = useState<ClientRow[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedCheckins, setSelectedCheckins] = useState<CheckIn[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'coach') { router.replace('/login'); return }
    setCoach(s)
    const clients = getClientsForCoach(s.id)
    const r = clients.map(c => {
      const checkins = getCheckInsForClient(c.id)
      return { client: c, lastCheckin: checkins[0], pending: checkins.filter(x => !x.reviewed).length }
    })
    setRows(r)
  }, [router])

  function selectClient(cid: string) {
    if (selected === cid) { setSelected(null); return }
    setSelected(cid)
    setSelectedCheckins(getCheckInsForClient(cid))
  }

  if (!coach) return null

  return (
    <div className="page-main">
      <Nav role="coach" />
      <div style={{ padding:'2rem', maxWidth:'900px' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>My Clients</h1>
        <p style={{ color:'#888', marginBottom:'2rem' }}>Review check-ins and keep your clients on track.</p>

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {rows.length === 0 && (
            <div className="card" style={{ textAlign:'center', padding:'2rem', color:'#666' }}>No clients assigned yet.</div>
          )}
          {rows.map(({ client, lastCheckin, pending }) => (
            <div key={client.id}>
              <div className="card" onClick={() => selectClient(client.id)}
                style={{ cursor:'pointer', borderColor: selected === client.id ? '#FFE000' : '#333' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', color:'#FFE000', fontSize:'1rem' }}>
                      {client.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight:'700', fontSize:'1rem' }}>{client.name}</div>
                      <div style={{ fontSize:'0.8rem', color:'#888' }}>{client.email}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', textAlign:'right' }}>
                    <div>
                      <div style={{ fontSize:'0.78rem', color:'#555' }}>Last weight</div>
                      <div style={{ fontWeight:'700', color:'#FFE000' }}>{lastCheckin ? `${lastCheckin.weight} kg` : '—'}</div>
                    </div>
                    <div>
                      {pending > 0
                        ? <span className="badge badge-yellow">{pending} to review</span>
                        : <span className="badge badge-green">All reviewed</span>
                      }
                    </div>
                  </div>
                </div>
              </div>

              {selected === client.id && (
                <div className="card" style={{ marginTop:'0.5rem', borderColor:'#2a2a1a' }}>
                  <h3 style={{ fontWeight:'700', fontSize:'0.95rem', marginBottom:'1rem' }}>Check-In History</h3>
                  {selectedCheckins.length === 0 && <p style={{ color:'#666', fontSize:'0.9rem' }}>No check-ins yet.</p>}
                  {selectedCheckins.map(c => (
                    <ClientCheckinRow key={c.id} checkin={c} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClientCheckinRow({ checkin }: { checkin: CheckIn }) {
  const [feedback, setFeedback] = useState(checkin.coach_feedback || '')
  const [saved, setSaved] = useState(checkin.reviewed)

  function handleSave() {
    const { markReviewed } = require('@/lib/store')
    markReviewed(checkin.id, feedback)
    setSaved(true)
  }

  return (
    <div style={{ borderBottom:'1px solid #1a1a1a', padding:'0.75rem 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
        <div>
          <div style={{ fontWeight:'600', fontSize:'0.9rem' }}>{checkin.date}</div>
          {checkin.notes && <div style={{ fontSize:'0.8rem', color:'#888', marginTop:'0.15rem' }}>Client: {checkin.notes}</div>}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontWeight:'700', color:'#FFE000' }}>{checkin.weight} kg</div>
          <span className={`badge badge-${saved ? 'green' : 'gray'}`} style={{ fontSize:'0.7rem', marginTop:'0.2rem' }}>
            {saved ? 'Reviewed' : 'Pending'}
          </span>
        </div>
      </div>
      {!saved && (
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <input className="input" value={feedback} onChange={e => setFeedback(e.target.value)}
            placeholder="Leave feedback for this client..." style={{ fontSize:'0.85rem' }} />
          <button className="btn-yellow" onClick={handleSave} style={{ whiteSpace:'nowrap', fontSize:'0.82rem', padding:'0.45rem 0.9rem' }}>
            Mark Reviewed
          </button>
        </div>
      )}
      {saved && feedback && <div style={{ fontSize:'0.8rem', color:'#4ade80' }}>Your feedback: {feedback}</div>}
    </div>
  )
}
