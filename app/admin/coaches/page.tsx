'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getCoaches, getClientsForCoach, getClockEntries, createUser } from '@/lib/store'
import { User, ClockEntry } from '@/lib/types'
import { Plus, X } from 'lucide-react'

type CoachRow = { coach: User; clientCount: number; totalMins: number; sessionCount: number }

export default function AdminCoaches() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [rows, setRows] = useState<CoachRow[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'coach123' })

  function loadData() {
    const coaches = getCoaches()
    const allClock = getClockEntries().filter(e => e.clock_out)
    const r: CoachRow[] = coaches.map(co => {
      const clients = getClientsForCoach(co.id)
      const sessions = allClock.filter(e => e.coach_id === co.id)
      const totalMins = sessions.reduce((s, e) => s + (e.duration_minutes || 0), 0)
      return { coach: co, clientCount: clients.length, totalMins, sessionCount: sessions.length }
    })
    setRows(r)
  }

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'admin') { router.replace('/login'); return }
    setAdmin(s)
    loadData()
  }, [router])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    createUser(form.name, form.email, form.password, 'coach')
    setShowAdd(false)
    setForm({ name:'', email:'', password:'coach123' })
    loadData()
  }

  if (!admin) return null

  return (
    <div style={{ marginLeft:'220px', minHeight:'100vh', background:'#0D0D0D' }}>
      <Nav role="admin" />
      <div style={{ padding:'2rem', maxWidth:'900px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem' }}>
          <div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>Coaches</h1>
            <p style={{ color:'#888' }}>Manage your assistant coaches and track hours.</p>
          </div>
          <button className="btn-yellow" onClick={() => setShowAdd(true)}
            style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <Plus size={16}/> Add Coach
          </button>
        </div>

        {showAdd && (
          <div className="card" style={{ marginBottom:'1.5rem', borderColor:'#FFE000' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h2 style={{ fontWeight:'700', fontSize:'0.95rem' }}>Add Coach</h2>
              <button onClick={() => setShowAdd(false)} style={{ background:'transparent', border:'none', color:'#666', cursor:'pointer' }}>
                <X size={16}/>
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', color:'#888', marginBottom:'0.3rem' }}>Name</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} placeholder="Coach name"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', color:'#888', marginBottom:'0.3rem' }}>Email</label>
                <input className="input" type="email" required value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} placeholder="email@example.com"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', color:'#888', marginBottom:'0.3rem' }}>Password</label>
                <input className="input" required value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} placeholder="Temporary password"/>
              </div>
              <div style={{ gridColumn:'span 3' }}>
                <button className="btn-yellow" type="submit" style={{ width:'100%', padding:'0.75rem' }}>Create Coach Account</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {rows.map(({ coach, clientCount, totalMins, sessionCount }) => {
            const hours = Math.floor(totalMins / 60)
            const mins = totalMins % 60
            const payRate = 65
            const monthlyPay = clientCount * payRate
            return (
              <div key={coach.id} className="card">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', color:'#4ade80', fontSize:'1.1rem' }}>
                      {coach.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight:'700', fontSize:'1rem' }}>{coach.name}</div>
                      <div style={{ fontSize:'0.8rem', color:'#888' }}>{coach.email}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,auto)', gap:'2rem', textAlign:'center' }}>
                    {[
                      { label:'Clients', value: clientCount },
                      { label:'Sessions', value: sessionCount },
                      { label:'Hours Logged', value: `${hours}h ${mins}m` },
                      { label:'Monthly Pay', value: `$${monthlyPay}`, yellow:true },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize:'1.1rem', fontWeight:'800', color: s.yellow ? '#FFE000' : '#e5e5e5' }}>{s.value}</div>
                        <div style={{ fontSize:'0.72rem', color:'#555' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
