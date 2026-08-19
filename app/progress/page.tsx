'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getCheckInsForClient, getWorkoutsForClient } from '@/lib/store'
import { CheckIn, WorkoutLog } from '@/lib/types'
import { TrendingDown, Dumbbell, Calendar } from 'lucide-react'

export default function ProgressPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [tab, setTab] = useState<'weight'|'workouts'>('weight')

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
    setCheckins(getCheckInsForClient(s.id))
    setWorkouts(getWorkoutsForClient(s.id))
  }, [router])

  if (!user) return null

  const reversed = [...checkins].reverse()
  const startWeight = reversed[0]?.weight
  const currentWeight = reversed[reversed.length - 1]?.weight
  const totalLost = startWeight && currentWeight ? (startWeight - currentWeight) : 0
  const maxW = Math.max(...reversed.map(c => c.weight), 0)
  const minW = Math.min(...reversed.map(c => c.weight), maxW)
  const range = maxW - minW || 1

  return (
    <div style={{ marginLeft:'220px', minHeight:'100vh', background:'#0D0D0D' }}>
      <Nav role="client" />
      <div style={{ padding:'2rem', maxWidth:'820px' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>My Progress</h1>
        <p style={{ color:'#888', marginBottom:'2rem' }}>Every number tells a story. Keep showing up.</p>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Start Weight', value: startWeight ? `${startWeight} kg` : '—', icon:<Calendar size={18}/> },
            { label:'Current Weight', value: currentWeight ? `${currentWeight} kg` : '—', icon:<TrendingDown size={18}/> },
            { label:'Total Lost', value: totalLost > 0 ? `${totalLost.toFixed(1)} kg` : '—', icon:<TrendingDown size={18}/> },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign:'center' }}>
              <div style={{ color:'#FFE000', display:'flex', justifyContent:'center', marginBottom:'0.4rem' }}>{s.icon}</div>
              <div style={{ fontSize:'1.5rem', fontWeight:'800', color:'#FFE000' }}>{s.value}</div>
              <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
          {(['weight','workouts'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'0.55rem 1.2rem', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.88rem', fontWeight:'600',
                background: tab === t ? '#FFE000' : '#222', color: tab === t ? '#0D0D0D' : '#888' }}>
              {t === 'weight' ? 'Weight History' : 'Workouts'}
            </button>
          ))}
        </div>

        {tab === 'weight' && (
          <div className="card">
            {checkins.length === 0
              ? <p style={{ color:'#666', textAlign:'center', padding:'2rem' }}>No check-ins yet. Start checking in daily.</p>
              : (
                <>
                  {/* Simple bar chart */}
                  <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', height:'120px', marginBottom:'1.5rem' }}>
                    {reversed.slice(-14).map((c, i) => {
                      const h = ((c.weight - minW) / range) * 80 + 20
                      return (
                        <div key={c.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                          <div title={`${c.weight} kg`}
                            style={{ width:'100%', height:`${h}px`, background:'#FFE000', borderRadius:'3px 3px 0 0', opacity:0.8 }}/>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'#555', marginBottom:'1.5rem' }}>
                    <span>{reversed.slice(-14)[0]?.date}</span>
                    <span>Last 14 days</span>
                    <span>{reversed[reversed.length-1]?.date}</span>
                  </div>
                  {/* Table */}
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid #2a2a2a' }}>
                        <th style={{ textAlign:'left', padding:'0.5rem 0', color:'#555', fontWeight:'600' }}>Date</th>
                        <th style={{ textAlign:'right', padding:'0.5rem 0', color:'#555', fontWeight:'600' }}>Weight</th>
                        <th style={{ textAlign:'right', padding:'0.5rem 0', color:'#555', fontWeight:'600' }}>Change</th>
                        <th style={{ textAlign:'right', padding:'0.5rem 0', color:'#555', fontWeight:'600' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkins.map((c, idx) => {
                        const prev = checkins[idx + 1]
                        const diff = prev ? c.weight - prev.weight : 0
                        return (
                          <tr key={c.id} style={{ borderBottom:'1px solid #1a1a1a' }}>
                            <td style={{ padding:'0.6rem 0', color:'#999' }}>{c.date}</td>
                            <td style={{ padding:'0.6rem 0', textAlign:'right', fontWeight:'700', color:'#FFE000' }}>{c.weight} kg</td>
                            <td style={{ padding:'0.6rem 0', textAlign:'right', fontSize:'0.82rem',
                              color: diff < 0 ? '#4ade80' : diff > 0 ? '#f87171' : '#888' }}>
                              {prev ? (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)) : '—'}
                            </td>
                            <td style={{ padding:'0.6rem 0', textAlign:'right' }}>
                              <span className={`badge badge-${c.reviewed ? 'green' : 'gray'}`}>
                                {c.reviewed ? 'Reviewed' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>
              )
            }
          </div>
        )}

        {tab === 'workouts' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {workouts.length === 0
              ? (
                <div className="card" style={{ textAlign:'center', padding:'2rem' }}>
                  <Dumbbell size={32} style={{ color:'#333', margin:'0 auto 0.75rem' }}/>
                  <p style={{ color:'#666' }}>No workouts logged yet.</p>
                  <button className="btn-yellow" style={{ marginTop:'1rem' }} onClick={() => router.push('/workout')}>Log First Workout</button>
                </div>
              )
              : workouts.map(w => (
                <div key={w.id} className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                    <div style={{ fontWeight:'700', color:'#FFE000' }}>{w.date}</div>
                    <span style={{ fontSize:'0.82rem', color:'#888' }}>{w.exercises.length} exercises</span>
                  </div>
                  {w.exercises.map((ex, i) => (
                    <div key={i} style={{ marginBottom:'0.5rem' }}>
                      <div style={{ fontSize:'0.9rem', fontWeight:'600', marginBottom:'0.2rem' }}>{ex.name}</div>
                      <div style={{ fontSize:'0.8rem', color:'#666' }}>
                        {ex.sets.map((s, j) => (
                          <span key={j} style={{ marginRight:'0.75rem' }}>
                            Set {j+1}: {s.reps}× {s.weight}{s.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {w.notes && <p style={{ fontSize:'0.82rem', color:'#666', marginTop:'0.75rem', fontStyle:'italic' }}>{w.notes}</p>}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
