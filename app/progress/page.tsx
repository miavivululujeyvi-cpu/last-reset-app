'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getCheckInsForClient, getWorkoutsForClient, getMealsForClient } from '@/lib/store'
import { CheckIn, WorkoutLog, MealLog } from '@/lib/types'
import { TrendingDown, Dumbbell, Calendar, TrendingUp, Award, Star } from 'lucide-react'

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
            { key:'weight', label:'⚖️ Weight' },
            { key:'workouts', label:'💪 Workouts' },
            { key:'report', label:'📋 Report Card' },
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
          // Last 7 days
          const days: string[] = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i)
            days.push(d.toISOString().split('T')[0])
          }
          const checkinDays = days.filter(d => checkins.some(c => c.date === d))
          const workoutDays = days.filter(d => workouts.some(w => w.date === d))
          const mealDays   = days.filter(d => meals.some(m => m.date === d))

          const checkinPct  = Math.round((checkinDays.length / 7) * 100)
          const workoutPct  = Math.round((workoutDays.length / 3) * 100) // goal: 3x/week
          const mealPct     = Math.round((mealDays.length / 7) * 100)

          const ratedMeals = meals.filter(m => m.rating != null && m.date >= days[0])
          const avgRating  = ratedMeals.length > 0 ? (ratedMeals.reduce((s, m) => s + m.rating!, 0) / ratedMeals.length) : null

          const overall = Math.round((checkinPct + Math.min(workoutPct, 100) + mealPct) / 3)
          function grade(pct: number) {
            if (pct >= 90) return { letter: 'A', color: '#16a34a' }
            if (pct >= 75) return { letter: 'B', color: '#22c55e' }
            if (pct >= 60) return { letter: 'C', color: '#f59e0b' }
            if (pct >= 40) return { letter: 'D', color: '#f97316' }
            return { letter: 'F', color: '#dc2626' }
          }
          const g = grade(overall)

          return (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {/* Overall grade */}
              <div className="hero-card" style={{ textAlign:'center', padding:'2rem' }}>
                <div style={{ fontSize:'0.78rem', color:'#AAA', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.5rem' }}>This Week</div>
                <div style={{ fontSize:'5rem', fontWeight:'900', color: g.letter === 'A' ? '#FFE000' : '#FFFFFF', lineHeight:1, marginBottom:'0.35rem' }}>{g.letter}</div>
                <div style={{ fontSize:'0.88rem', color:'#AAA' }}>Overall consistency score: {overall}%</div>
              </div>

              {/* Category breakdown */}
              {[
                { label:'Daily Check-ins', emoji:'⚖️', done:checkinDays.length, goal:7, pct:checkinPct, detail:`${checkinDays.length} of 7 days` },
                { label:'Workouts', emoji:'💪', done:workoutDays.length, goal:3, pct:Math.min(workoutPct,100), detail:`${workoutDays.length} of 3+ sessions` },
                { label:'Meal Logging', emoji:'📸', done:mealDays.length, goal:7, pct:mealPct, detail:`${mealDays.length} of 7 days` },
              ].map(cat => {
                const cg = grade(cat.pct)
                return (
                  <div key={cat.label} className="card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                      <div>
                        <span style={{ fontWeight:'700', fontSize:'0.95rem' }}>{cat.emoji} {cat.label}</span>
                        <div style={{ fontSize:'0.75rem', color:'#888', marginTop:'0.15rem' }}>{cat.detail}</div>
                      </div>
                      <div style={{ fontSize:'1.5rem', fontWeight:'900', color:cg.color }}>{cg.letter}</div>
                    </div>
                    <div style={{ background:'#ECEEF5', borderRadius:'20px', height:'8px', overflow:'hidden' }}>
                      <div style={{ background: cg.color, height:'100%', width:`${cat.pct}%`, borderRadius:'20px', transition:'width 0.4s' }}/>
                    </div>
                    <div style={{ textAlign:'right', fontSize:'0.72rem', color:'#AAA', marginTop:'0.35rem' }}>{cat.pct}%</div>
                  </div>
                )
              })}

              {/* Meal rating summary */}
              {avgRating != null && (
                <div className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:'700', fontSize:'0.95rem' }}>🍽️ Meal Quality</div>
                      <div style={{ fontSize:'0.75rem', color:'#888', marginTop:'0.15rem' }}>Average coach rating this week</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
                      <Star size={18} fill="#FFE000" color="#FFE000"/>
                      <span style={{ fontSize:'1.4rem', fontWeight:'800', color:'#1A1A1A' }}>{avgRating.toFixed(1)}</span>
                      <span style={{ fontSize:'0.8rem', color:'#AAA' }}>/10</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Day-by-day grid */}
              <div className="card">
                <div style={{ fontWeight:'700', marginBottom:'0.85rem', fontSize:'0.9rem' }}>Daily Activity This Week</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'0.35rem', textAlign:'center' }}>
                  {days.map(d => {
                    const label = new Date(d + 'T12:00:00').toLocaleDateString('en', { weekday:'narrow' })
                    const hasCheckin = checkins.some(c => c.date === d)
                    const hasMeal    = meals.some(m => m.date === d)
                    const hasWorkout = workouts.some(w => w.date === d)
                    const score = [hasCheckin, hasMeal, hasWorkout].filter(Boolean).length
                    const bg = score === 3 ? '#FFE000' : score === 2 ? '#FFF59D' : score === 1 ? '#F4F5FA' : '#FFFFFF'
                    return (
                      <div key={d} style={{ display:'flex', flexDirection:'column', gap:'0.25rem', alignItems:'center' }}>
                        <div style={{ fontSize:'0.65rem', color:'#AAA', fontWeight:'600' }}>{label}</div>
                        <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:bg, border:'1px solid #E2E4EC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:'700', color: score === 3 ? '#1A1A1A' : '#888' }}>
                          {score}/3
                        </div>
                        <div style={{ fontSize:'0.6rem', color:'#CCC' }}>
                          {hasCheckin ? '⚖' : ''}{hasMeal ? '📸' : ''}{hasWorkout ? '💪' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop:'0.85rem', display:'flex', gap:'1rem', fontSize:'0.72rem', color:'#AAA', justifyContent:'center' }}>
                  <span>⚖ Check-in</span><span>📸 Meals</span><span>💪 Workout</span>
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
                  <div style={{ background:'rgba(255,224,0,0.12)', borderRadius:'10px', padding:'0.4rem 0.75rem', fontSize:'0.75rem', fontWeight:'700', color:'#997700' }}>
                    💪 Completed
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
