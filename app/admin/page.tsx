'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getClients, getCoaches, getCheckIns, getClockEntries } from '@/lib/store'
import { Users, UserCheck, TrendingUp, Clock } from 'lucide-react'

export default function AdminOverview() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState({ clients:0, coaches:0, checkins:0, pending:0, hoursLogged:0 })
  const [recentCheckins, setRecentCheckins] = useState<any[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'admin') { router.replace('/login'); return }
    setAdmin(s)

    const clients = getClients()
    const coaches = getCoaches()
    const checkins = getCheckIns()
    const clock = getClockEntries()
    const pending = checkins.filter(c => !c.reviewed).length
    const totalMins = clock.filter(e => e.clock_out).reduce((sum, e) => sum + (e.duration_minutes || 0), 0)

    setStats({
      clients: clients.length,
      coaches: coaches.length,
      checkins: checkins.length,
      pending,
      hoursLogged: Math.round(totalMins / 60),
    })

    const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]))
    const recent = [...checkins].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)
    setRecentCheckins(recent.map(c => ({ ...c, clientName: clientMap[c.client_id] || 'Unknown' })))
  }, [router])

  if (!admin) return null

  const revenue = { usd: 675, chf: 1050 }
  const expenses = 232.59
  const net = (revenue.usd + revenue.chf * 1.26 - expenses).toFixed(0)

  return (
    <div className="page-main">
      <Nav role="admin" />
      <div style={{ padding:'2rem', maxWidth:'980px' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:'800', marginBottom:'0.25rem' }}>
          Overview <span style={{ color:'#FFE000' }}>— Coach Jeyvi</span>
        </h1>
        <p style={{ color:'#888', marginBottom:'2rem' }}>The Last Reset Program: Admin Dashboard</p>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Active Clients', value:stats.clients, icon:<Users size={20}/>, color:'#FFE000' },
            { label:'Coaches', value:stats.coaches, icon:<UserCheck size={20}/>, color:'#4ade80' },
            { label:'Check-Ins Total', value:stats.checkins, icon:<TrendingUp size={20}/>, color:'#60a5fa' },
            { label:'Pending Review', value:stats.pending, icon:<Clock size={20}/>, color: stats.pending > 0 ? '#f87171' : '#4ade80' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign:'center' }}>
              <div style={{ color:s.color, display:'flex', justifyContent:'center', marginBottom:'0.4rem' }}>{s.icon}</div>
              <div style={{ fontSize:'2rem', fontWeight:'800', color:s.color }}>{s.value}</div>
              <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'0.15rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Revenue summary */}
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <h2 style={{ fontWeight:'700', fontSize:'0.95rem', marginBottom:'1rem' }}>Revenue Overview</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
            {[
              { label:'USD Clients', value:`$${revenue.usd}/mo` },
              { label:'CHF Clients', value:`CHF ${revenue.chf}/mo` },
              { label:'Total Expenses', value:`$${expenses}/mo` },
              { label:'Net Profit', value:`≈$${net}/mo`, yellow:true },
            ].map(r => (
              <div key={r.label} style={{ textAlign:'center', padding:'0.5rem' }}>
                <div style={{ fontSize:'1.2rem', fontWeight:'800', color: r.yellow ? '#FFE000' : '#e5e5e5' }}>{r.value}</div>
                <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'0.2rem' }}>{r.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'1rem', padding:'0.75rem', background:'rgba(255,224,0,0.05)', borderRadius:'6px', border:'1px solid rgba(255,224,0,0.1)' }}>
            <p style={{ fontSize:'0.82rem', color:'#888' }}>
              Goal: <strong style={{ color:'#FFE000' }}>$10,000/month</strong> by September 2026: current gap: ≈$8,002/month
            </p>
          </div>
        </div>

        {/* Recent check-ins */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h2 style={{ fontWeight:'700', fontSize:'0.95rem' }}>Recent Check-Ins</h2>
            <button className="btn-ghost" style={{ fontSize:'0.8rem', padding:'0.3rem 0.75rem' }} onClick={() => router.push('/admin/clients')}>
              View all clients
            </button>
          </div>
          {recentCheckins.length === 0
            ? <p style={{ color:'#666', fontSize:'0.9rem' }}>No check-ins yet.</p>
            : recentCheckins.map(c => (
              <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0', borderBottom:'1px solid #EEEEEE' }}>
                <div>
                  <div style={{ fontWeight:'600', fontSize:'0.9rem' }}>{c.clientName}</div>
                  <div style={{ fontSize:'0.78rem', color:'#555' }}>{c.date}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ fontWeight:'700', color:'#FFE000' }}>{c.weight} kg</div>
                  <span className={`badge badge-${c.reviewed ? 'green' : 'yellow'}`} style={{ fontSize:'0.7rem' }}>
                    {c.reviewed ? 'Reviewed' : 'Needs review'}
                  </span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
