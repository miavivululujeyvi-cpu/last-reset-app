'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getCheckInsForClient, getWorkoutsForClient, getMealsForClient } from '@/lib/store'
import { CheckIn, WorkoutLog, MealLog } from '@/lib/types'
import { TrendingDown, Dumbbell, Calendar, TrendingUp, Award, Star, Scale, UtensilsCrossed } from 'lucide-react'

export default function ProgressPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [meals, setMeals] = useState<MealLog[]>([])
  const [tab, setTab] = useState<'weight'|'workouts'|'report'>('weight')

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
    setCheckins(getCheckInsForClient(s.id))
    setWorkouts(getWorkoutsForClient(s.id))
    setMeals(getMealsForClient(s.id))
  }, [router])

  if (!user) return null

  const reversed = [...checkins].reverse()
  const startWeight = reversed[0]?.weight
  const currentWeight = reversed[reversed.length - 1]?.weight
  const totalLost = startWeight && currentWeight ? Math.max(0, startWeight - currentWeight) : 0
  const maxW = Math.max(...reversed.map(c => c.weight), 0) || 1
  const minW = Math.min(...reversed.map(c => c.weight), maxW)
  const range = maxW - minW || 1

  const last14 = reversed.slice(-14)

  return (
    <div className="page-main">
      <Nav role="client" />
      <div style={{ padding:'1.5rem', maxWidth:'820px' }}>

        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>
          My <span style={{ color:'#FFE000' }}>Progress</span>
        </h1>
        <p style={{ color:'#888', marginBottom:'1.75rem', fontSize:'0.88rem' }}>Every number tells a story. Keep showing up.</p>

        {/* ── Summary cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.85rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Start Weight', value: startWeight ? `${startWeight}` : '—', unit:'kg', icon:<Calendar size={18}/>, color:'#888' },
            { label:'Current Weight', value: currentWeight ? `${currentWeight}` : '—', unit:'kg', icon:<TrendingDown size={18}/>, color:'#FFE000' },
            { label:'Total Lost', value: totalLost > 0 ? `${totalLost.toFixed(1)}` : '0', unit:'kg', icon:<Award size={18}/>, color:'#16a34a' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign:'center', padding:'1.1rem 0.75rem' }}>
              <div style={{ color:s.color, display:'flex', justifyContent:'center', marginBottom:'0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize:'1.5rem', fontWeight:'800', color:s.color, lineHeight:1 }}>{s.value}
                <span style={{ fontSize:'0.65rem', color:'#AAA', fontWeight:'400' }}> {s.unit}</span>
              </div>
              <div style={{ fontSize:'0.68rem', color:'#999', marginTop:'0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem', overflowX:'auto', paddingBottom:'0.25rem' }} className="scroll-hide">
          {([
            { key:'weight', label:'Weight' },
            { key:'workouts', label:'Workouts' },
            { key:'report', label:'Report Card' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding:'0.6rem 1.1rem', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'0.85rem', fontWeight:'700', flexShrink:0,
                background: tab === t.key ? '#FFE000' : '#FFFFFF', color: tab === t.key ? '#1A1A1A' : '#888',
                boxShadow: tab === t.key ? '0 4px 12px rgba(255,224,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'weight' && (
          <div className="card">
            {checkins.length === 0 ? (
              <div style={{ textAlign:'center', padding:'2.5rem', color:'#CCC' }}>
                <TrendingDown size={36} style={{ margin:'0 auto 1rem', color:'#E2E4EC' }}/>
                <p>No check-ins yet. Start checking in daily.</p>
              </div>
            ) : (
              <>
                {/* Chart */}
                <div style={{ marginBottom:'1.5rem' }}>
                  <div style={{ fontSize:'0.78rem', color:'#888', fontWeight:'600', marginBottom:'0.75rem' }}>
                    Last {last14.length} check-ins
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:'3px', height:'110px', padding:'0 4px' }}>
                    {last14.map((c, i) => {
                      const h = ((c.weight - minW) / range) * 80 + 20
                      const isLatest = i === last14.length - 1
                      return (
                        <div key={c.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
                          {isLatest && (
                            <div style={{ fontSize:'0.65rem', fontWeight:'700', color:'#1A1A1A', whiteSpace:'nowrap' }}>
                              {c.weight}kg
                            </div>
                          )}
                          <div title={`${c.weight} kg — ${c.date}`}
                            style={{ width:'100%', height:`${h}px`,
                              background: isLatest ? '#FFE000' : '#E2E4EC',
                              borderRadius:'5px 5px 0 0', transition:'height 0.3s ease',
                              position:'relative' }}/>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.68rem', color:'#CCC', marginTop:'0.4rem', padding:'0 4px' }}>
                    <span>{last14[0]?.date}</span>
                    <span>{last14[last14.length-1]?.date}</span>
                  </div>
                </div>

                {/* Table */}
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid #F4F5FA' }}>
                      <th style={{ textAlign:'left', padding:'0.6rem 0', color:'#888', fontWeight:'600', fontSize:'0.78rem' }}>Date</th>
                      <th style={{ textAlign:'right', padding:'0.6rem 0', color:'#888', fontWeight:'600', fontSize:'0.78rem' }}>Weight</th>
                      <th style={{ textAlign:'right', padding:'0.6rem 0', color:'#888', fontWeight:'600', fontSize:'0.78rem' }}>Change</th>
                      <th style={{ textAlign:'right', padding:'0.6rem 0', color:'#888', fontWeight:'600', fontSize:'0.78rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map((c, idx) => {
                      const prev = checkins[idx + 1]
                      const diff = prev ? c.weight - prev.weight : 0
                      return (
                        <tr key={c.id} style={{ borderBottom:'1px solid #F4F5FA' }}>
                          <td style={{ padding:'0.7rem 0', color:'#666', fontSize:'0.85rem' }}>{c.date}</td>
                          <td style={{ padding:'0.7rem 0', textAlign:'right', fontWeight:'800', color:'#1A1A1A' }}>{c.weight} kg</td>
                          <td style={{ padding:'0.7rem 0', textAlign:'right', fontSize:'0.82rem', fontWeight:'700',
                            color: diff < 0 ? '#16a34a' : diff > 0 ? '#dc2626' : '#888' }}>
                            {prev ? (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)) : '—'}
                          </td>
                          <td style={{ padding:'0.7rem 0', textAlign:'right' }}>
                            <span className={`badge badge-${c.reviewed ? 'green' : 'gray'}`}>
                              {c.reviewed ? '✓' : '···'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {tab === 'report' && (() => {
          // ── Helpers ──────────────────────────────────────────────────────
          function weekDays(monStart: string): string[] {
            return Array.from({ length: 7 }, (_, i) => {
              const d = new Date(monStart + 'T12:00:00'); d.setDate(d.getDate() + i)
              return d.toISOString().split('T')[0]
            })
          }
          function currentMonday(): string {
            const now = new Date(); const day = now.getDay()
            now.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
            return now.toISOString().split('T')[0]
          }
          function weekLabel(monStart: string): string {
            const s = new Date(monStart + 'T12:00:00')
            const e = new Date(monStart + 'T12:00:00'); e.setDate(e.getDate() + 6)
            const fmt = (d: Date) => d.toLocaleDateString('en', { month:'short', day:'numeric' })
            return `${fmt(s)} – ${fmt(e)}`
          }
          function scoreColor(s: number) {
            if (s >= 9) return '#16a34a'
            if (s >= 7) return '#22c55e'
            if (s >= 5) return '#f59e0b'
            if (s >= 3) return '#f97316'
            return '#dc2626'
          }
          function calcWeek(monStart: string) {
            const days = weekDays(monStart)
            const ciDays  = days.filter(d => checkins.some(c => c.date === d)).length
            const woDays  = days.filter(d => workouts.some(w => w.date === d)).length
            const rated   = meals.filter(m => days.includes(m.date) && m.rating != null)
            const ciScore  = parseFloat(((ciDays / 7) * 10).toFixed(1))
            const woScore  = parseFloat((Math.min(woDays / 3, 1) * 10).toFixed(1))
            const mlScore  = rated.length > 0
              ? parseFloat((rated.reduce((s, m) => s + m.rating!, 0) / rated.length).toFixed(1))
              : null
            const nums = [ciScore, woScore, ...(mlScore != null ? [mlScore] : [])]
            const overall = nums.length ? parseFloat((nums.reduce((a, v) => a + v, 0) / nums.length).toFixed(1)) : null
            return { days, ciScore, woScore, mlScore, overall, ciDays, woDays, ratedCount: rated.length }
          }

          // Build last 6 weeks (current first)
          const mon = currentMonday()
          const weeks = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(mon + 'T12:00:00'); d.setDate(d.getDate() - i * 7)
            return d.toISOString().split('T')[0]
          })

          const current = calcWeek(weeks[0])

          return (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* ── This week's big card ── */}
              <div className="hero-card">
                <div style={{ fontSize:'0.72rem', color:'#AAA', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.85rem' }}>
                  This Week · {weekLabel(weeks[0])}
                </div>

                {/* Three scores */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem', marginBottom:'1.25rem' }}>
                  {[
                    { label:'Meals', icon:<UtensilsCrossed size={18}/>, score: current.mlScore, sub: current.ratedCount > 0 ? `${current.ratedCount} rated` : 'Pending rating', pending: current.mlScore == null },
                    { label:'Workouts', icon:<Dumbbell size={18}/>, score: current.woScore, sub: `${current.woDays} of 3 sessions`, pending: false },
                    { label:'Check-ins', icon:<Scale size={18}/>, score: current.ciScore, sub: `${current.ciDays} of 7 days`, pending: false },
                  ].map(c => (
                    <div key={c.label} style={{ background:'rgba(255,255,255,0.07)', borderRadius:'12px', padding:'0.85rem 0.5rem', textAlign:'center' }}>
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.3rem', color:'rgba(255,255,255,0.5)' }}>{c.icon}</div>
                      <div style={{ fontSize:'1.6rem', fontWeight:'900', color: c.pending ? '#666' : scoreColor(c.score!), lineHeight:1 }}>
                        {c.pending ? '—' : c.score}
                        {!c.pending && <span style={{ fontSize:'0.65rem', color:'#888', fontWeight:'400' }}>/10</span>}
                      </div>
                      <div style={{ fontSize:'0.68rem', color:'#888', marginTop:'0.3rem', fontWeight:'600' }}>{c.label}</div>
                      <div style={{ fontSize:'0.6rem', color:'#666', marginTop:'0.1rem' }}>{c.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Overall */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.85rem 1rem', background:'rgba(255,255,255,0.06)', borderRadius:'12px' }}>
                  <span style={{ fontSize:'0.82rem', color:'#AAA', fontWeight:'600' }}>Weekly Score</span>
                  {current.overall != null ? (
                    <div style={{ display:'flex', alignItems:'baseline', gap:'0.25rem' }}>
                      <span style={{ fontSize:'2rem', fontWeight:'900', color: scoreColor(current.overall) }}>{current.overall}</span>
                      <span style={{ fontSize:'0.85rem', color:'#666' }}>/10</span>
                    </div>
                  ) : (
                    <span style={{ color:'#555', fontSize:'0.85rem' }}>In progress</span>
                  )}
                </div>
              </div>

              {/* ── Week-by-week history ── */}
              <div className="card" style={{ padding:'1rem' }}>
                <div style={{ fontWeight:'800', fontSize:'0.9rem', marginBottom:'1rem' }}>Week by Week</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  {weeks.map((wk, idx) => {
                    const w = calcWeek(wk)
                    const isThis = idx === 0
                    return (
                      <div key={wk} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.7rem 0.85rem', borderRadius:'10px', background: isThis ? 'rgba(255,224,0,0.07)' : '#F8F9FC', border: isThis ? '1px solid rgba(255,224,0,0.2)' : '1px solid transparent' }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'0.78rem', fontWeight:'700', color:'#1A1A1A', marginBottom:'0.25rem' }}>
                            {isThis ? 'This week' : weekLabel(wk)}
                          </div>
                          <div style={{ display:'flex', gap:'0.75rem', fontSize:'0.68rem', color:'#999' }}>
                            <span>Meals: {w.mlScore != null ? `${w.mlScore}/10` : '—'}</span>
                            <span>Workouts: {w.woScore}/10</span>
                            <span>Check-ins: {w.ciScore}/10</span>
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          {w.overall != null ? (
                            <>
                              <div style={{ fontSize:'1.3rem', fontWeight:'900', color: scoreColor(w.overall), lineHeight:1 }}>{w.overall}</div>
                              <div style={{ fontSize:'0.62rem', color:'#AAA' }}>/10</div>
                            </>
                          ) : (
                            <div style={{ fontSize:'0.75rem', color:'#CCC' }}>—</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop:'0.85rem', padding:'0.6rem 0.85rem', background:'#F4F5FA', borderRadius:'8px', fontSize:'0.72rem', color:'#888', lineHeight:'1.5' }}>
                  Meals rated by your coach · 3 workouts/week = 10/10 · 7 check-ins/week = 10/10
                </div>
              </div>
            </div>
          )
        })()}

        {tab === 'workouts' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {workouts.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:'2.5rem' }}>
                <Dumbbell size={36} style={{ color:'#E2E4EC', margin:'0 auto 1rem' }}/>
                <p style={{ color:'#888', marginBottom:'1rem' }}>No workouts logged yet.</p>
                <button className="btn-yellow" onClick={() => router.push('/workout')}>Log First Workout</button>
              </div>
            ) : workouts.map(w => (
              <div key={w.id} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.85rem' }}>
                  <div>
                    <div style={{ fontWeight:'800', color:'#1A1A1A', fontSize:'0.95rem' }}>{w.date}</div>
                    <div style={{ fontSize:'0.75rem', color:'#888', marginTop:'0.1rem' }}>{w.exercises.length} exercises</div>
                  </div>
                  <div style={{ background:'rgba(255,224,0,0.12)', borderRadius:'10px', padding:'0.4rem 0.75rem', fontSize:'0.75rem', fontWeight:'700', color:'#997700', display:'flex', alignItems:'center', gap:'0.35rem' }}>
                    <Dumbbell size={13}/> Completed
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {w.exercises.map((ex, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', background:'#F4F5FA', borderRadius:'8px' }}>
                      <span style={{ fontSize:'0.85rem', fontWeight:'600' }}>{ex.name}</span>
                      <span style={{ fontSize:'0.78rem', color:'#888' }}>
                        {ex.sets.map((s, j) => `${s.reps}×${s.weight}${s.unit}`).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
                {w.notes && <p style={{ fontSize:'0.8rem', color:'#888', marginTop:'0.75rem', fontStyle:'italic' }}>{w.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
