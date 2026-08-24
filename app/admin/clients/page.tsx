'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getClients, getCheckInsForClient, getCoaches, createUser } from '@/lib/store'
import { User, CheckIn } from '@/lib/types'
import { Plus, X } from 'lucide-react'

type ClientRow = { client: User; lastCheckin: CheckIn | undefined; total: number; pending: number; coachName: string }

export default function AdminClients() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [rows, setRows] = useState<ClientRow[]>([])
  const [coaches, setCoaches] = useState<User[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'client123', coach_id:'' })

  function loadData() {
    const cls = getClients()
    const chs = getCoaches()
    setCoaches(chs)
    const coachMap = Object.fromEntries(chs.map(c => [c.id, c.name]))
    const r: ClientRow[] = cls.map(c => {
      const checkins = getCheckInsForClient(c.id)
      return {
        client: c,
        lastCheckin: checkins[0],
        total: checkins.length,
        pending: checkins.filter(x => !x.reviewed).length,
        coachName: coachMap[(c as any).coach_id] || 'Unassigned',
      }
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
    createUser(form.name, form.email, form.password, 'client', form.coach_id || undefined)
    setShowAdd(false)
    setForm({ name:'', email:'', password:'client123', coach_id:'' })
    loadData()
  }

  if (!admin) return null

  return (
    <div className="page-main">
      <Nav role="admin" />
      <div style={{ padding:'2rem', maxWidth:'1000px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem' }}>
          <div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>Clients</h1>
            <p style={{ color:'#888' }}>{rows.length} active clients</p>
          </div>
          <button className="btn-yellow" onClick={() => setShowAdd(true)}
            style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <Plus size={16}/> Add Client
          </button>
        </div>

        {showAdd && (
          <div className="card" style={{ marginBottom:'1.5rem', borderColor:'#FFE000' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h2 style={{ fontWeight:'700', fontSize:'0.95rem' }}>Add New Client</h2>
              <button onClick={() => setShowAdd(false)} style={{ background:'transparent', border:'none', color:'#666', cursor:'pointer' }}>
                <X size={16}/>
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', color:'#888', marginBottom:'0.3rem' }}>Name</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} placeholder="Client name"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', color:'#888', marginBottom:'0.3rem' }}>Email</label>
                <input className="input" type="email" required value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} placeholder="email@example.com"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', color:'#888', marginBottom:'0.3rem' }}>Password</label>
                <input className="input" required value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} placeholder="Temporary password"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', color:'#888', marginBottom:'0.3rem' }}>Assign Coach</label>
                <select className="input" value={form.coach_id} onChange={e => setForm(f => ({...f, coach_id:e.target.value}))}>
                  <option value="">No coach</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <button className="btn-yellow" type="submit" style={{ width:'100%', padding:'0.75rem' }}>Create Client</button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.88rem' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #E2E4EC' }}>
                {['Name','Coach','Last Check-In','Weight','Check-Ins','Pending'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'0.6rem 0.5rem', color:'#555', fontWeight:'600', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ client, lastCheckin, total, pending, coachName }) => (
                <tr key={client.id} style={{ borderBottom:'1px solid #EEEEEE' }}>
                  <td style={{ padding:'0.75rem 0.5rem' }}>
                    <div style={{ fontWeight:'600' }}>{client.name}</div>
                    <div style={{ fontSize:'0.78rem', color:'#555' }}>{client.email}</div>
                  </td>
                  <td style={{ padding:'0.75rem 0.5rem', color:'#888' }}>{coachName}</td>
                  <td style={{ padding:'0.75rem 0.5rem', color:'#888' }}>{lastCheckin?.date || '—'}</td>
                  <td style={{ padding:'0.75rem 0.5rem', fontWeight:'700', color:'#FFE000' }}>{lastCheckin ? `${lastCheckin.weight} kg` : '—'}</td>
                  <td style={{ padding:'0.75rem 0.5rem', color:'#888' }}>{total}</td>
                  <td style={{ padding:'0.75rem 0.5rem' }}>
                    {pending > 0
                      ? <span className="badge badge-yellow">{pending}</span>
                      : <span className="badge badge-green">0</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
