'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getCheckInsForClient, getWorkoutsForClient } from '@/lib/store'
import { CheckIn, WorkoutLog } from '@/lib/types'
import { Camera, Dumbbell, TrendingUp, CheckCircle, Clock, Bot, Flame, ChevronRight, Heart, ListChecks, Scale, TrendingDown, MessageSquare, Star } from 'lucide-react'

function MacroRing({ value, max, label, color, unit = 'g' }: {
  value: number; max: number; label: string; color: string; unit?: string
}) {
  const r = 28
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const dash = pct * circ
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.35rem' }}>
      <svg width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#F0F2F8" strokeWidth="6"/>
        <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 35 35)"/>
        <text x="35" y="33" textAnchor="middle" fill="#1A1A1A" fontSize="11" fontWeight="800" fontFamily="Arial">{value}</text>
        <text x="35" y="45" textAnchor="middle" fill="#999" fontSize="9" fontFamily="Arial">{unit}</text>
      </svg>
      <span style={{ fontSize:'0.7rem', color:'#666', fontWeight:'600' }}>{label}</span>
    </div>
  )
}

function StatCard({ icon, value, unit, label, color }: { icon:React.ReactNode; value:string; unit:string; label:string; color:string }) {
  return (
    <div className="card" style={{ textAlign:'center', padding:'1rem 0.5rem' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.3rem', color }}>{icon}</div>
      <div style={{ fontSize:'1.3rem', fontWeight:'800', color, lineHeight:1.1 }}>
        {value}
        <span style={{ fontSize:'0.62rem', color:'#AAA', fontWeight:'400' }}> {unit}</span>
      </div>
      <div style={{ fontSize:'0.65rem', color:'#999', marginTop:'0.25rem', lineHeight:1.3 }}>{label}</div>
    </div>
  )
}

function TaskRow({ done, label, sub, action, icon }: { done:boolean; label:string; sub:string; action:()=>void; icon:React.ReactNode }) {
  return (
    <div onClick={!done ? action : undefined}
      style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.85rem 1rem',
        background: done ? 'rgba(34,197,94,0.06)' : 'rgba(255,224,0,0.07)',
        borderRadius:'12px', border:`1px solid ${done ? 'rgba(34,197,94,0.2)' : 'rgba(255,224,0,0.3)'}`,
        cursor: done ? 'default' : 'pointer' }}>
      <div style={{ width:'38px', height:'38px', borderRadius:'10px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
        background: done ? 'rgba(34,197,94,0.12)' : 'rgba(255,224,0,0.12)',
        color: done ? '#16a34a' : '#997700' }}>
        {done ? <CheckCircle size={20}/> : icon}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'0.92rem', fontWeight:'700', color: done ? '#16a34a' : '#1A1A1A' }}>{label}</div>
        <div style={{ fontSize:'0.75rem', color:'#888', marginTop:'0.1rem' }}>{sub}</div>
      </div>
      {done
        ? <span className="badge badge-green">Done ✓</span>
        : <div style={{ color:'#FFE000' }}><ChevronRight size={18}/></div>}
    </div>
  )
}

function calcStreak(checkins: CheckIn[]): number {
  if (!checkins.length) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 60; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (checkins.find(c => c.date === ds)) streak++
    else if (i > 0) break
  }
  return streak
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function ClientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
    setCheckins(getCheckInsForClient(s.id))
    setWorkouts(getWorkoutsForClient(s.id))
  }, [router])

  if (!user) return null

  const todayStr = new Date().toISOString().split('T')[0]
  const checkedInToday = checkins.some(c => c.date === todayStr)
  const workedOutToday = workouts.some(w => w.date === todayStr)
  const streak = calcStreak(checkins)
  const latestWeight = checkins[0]?.weight
  const startWeight = checkins[checkins.length - 1]?.weight
  const weightLost = startWeight && latestWeight ? Math.max(0, startWeight - latestWeight) : 0

  const dateStr = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })

  return (
    <div className="page-main">
      <Nav role="client" />
      <div style={{ padding:'1.5rem', maxWidth:'820px' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
          <div>
            <p style={{ fontSize:'0.8rem', color:'#AAA', marginBottom:'0.2rem', fontWeight:'500' }}>{dateStr}</p>
            <h1 style={{ fontSize:'1.7rem', fontWeight:'800', lineHeight:1.1 }}>
              {getGreeting()},<br/>
              <span style={{ color:'#FFE000' }}>{user.name}</span>
            </h1>
          </div>
          <div style={{ background: streak > 0 ? '#FFE000' : '#F0F2F8', borderRadius:'14px', padding:'0.6rem 0.85rem', textAlign:'center', minWidth:'58px', boxShadow: streak > 0 ? '0 4px 12px rgba(255,224,0,0.3)' : 'none' }}>
            <Flame size={22} style={{ color: streak > 0 ? '#1A1A1A' : '#CCC' }} />
            <div style={{ fontSize:'0.75rem', fontWeight:'800', color: streak > 0 ? '#1A1A1A' : '#AAA', marginTop:'0.2rem' }}>{streak}d</div>
          </div>
        </div>

        {/* ── Check-in reminder banner ── */}
        {!checkedInToday && (
          <div onClick={() => router.push('/checkin')}
            style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem', marginBottom:'1.25rem',
              background:'#1A1A1A', borderRadius:'16px', cursor:'pointer', transition:'opacity 0.15s' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'rgba(255,224,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Camera size={20} style={{ color:'#FFE000' }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:'700', fontSize:'0.92rem', color:'#FFFFFF' }}>Log your weight today</div>
              <div style={{ fontSize:'0.76rem', color:'#888', marginTop:'0.1rem' }}>Keep your streak alive. Takes 30 seconds.</div>
            </div>
            <ChevronRight size={18} style={{ color:'#FFE000', flexShrink:0 }} />
          </div>
        )}

        {/* ── Workout hero card ── */}
        <div className="hero-card" style={{ marginBottom:'1.25rem' }}>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:'0.68rem', color:'#FFE000', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:'0.6rem' }}>
              Today's Workout Plan
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:'1.6rem', fontWeight:'800', lineHeight:1.15, color:'#FFFFFF', marginBottom:'0.75rem' }}>
                  Full Body<br/>
                  <span style={{ color:'#FFE000' }}>Reset</span>
                </div>
                <div style={{ display:'flex', gap:'1.25rem', marginBottom:'1.25rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.8rem', color:'#999' }}>
                    <Clock size={13} style={{ color:'#FFE000' }}/> 45 min
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.8rem', color:'#999' }}>
                    <Flame size={13} style={{ color:'#FFE000' }}/> 6 muscle groups
                  </div>
                </div>
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button onClick={() => router.push('/plan')}
                    style={{ background:'#FFE000', color:'#1A1A1A', border:'none', borderRadius:'10px', padding:'0.65rem 1.3rem', fontWeight:'800', fontSize:'0.88rem', cursor:'pointer' }}>
                    View Plan
                  </button>
                  <button onClick={() => router.push('/workout')}
                    style={{ background:'rgba(255,255,255,0.1)', color:'#FFFFFF', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'10px', padding:'0.65rem 1rem', fontWeight:'600', fontSize:'0.88rem', cursor:'pointer' }}>
                    Log Workout
                  </button>
                </div>
              </div>
              {/* Workout count badge */}
              <div style={{ textAlign:'center', background:'rgba(255,224,0,0.12)', borderRadius:'14px', padding:'0.85rem 1rem', border:'1px solid rgba(255,224,0,0.2)', flexShrink:0 }}>
                <div style={{ fontSize:'1.6rem', fontWeight:'800', color:'#FFE000', lineHeight:1 }}>{workouts.length}</div>
                <div style={{ fontSize:'0.62rem', color:'#999', marginTop:'0.25rem', lineHeight:1.3 }}>sessions<br/>logged</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem', marginBottom:'1.25rem' }}>
          <StatCard icon={<Scale size={20}/>} value={latestWeight ? `${latestWeight}` : '—'} unit="kg" label="Current Weight" color="#FFE000" />
          <StatCard icon={<TrendingDown size={20}/>} value={weightLost > 0 ? `${weightLost.toFixed(1)}` : '0'} unit="kg lost" label="Since You Started" color="#4ade80" />
          <StatCard icon={<Dumbbell size={20}/>} value={`${workouts.length}`} unit="sessions" label="Total Logged" color="#60a5fa" />
        </div>

        {/* ── Nutrition goals ── */}
        <div className="card" style={{ marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
            <div>
              <div className="section-title">Nutrition Guide</div>
              <p style={{ fontSize:'0.75rem', color:'#AAA', marginTop:'0.15rem' }}>Daily targets from your program</p>
            </div>
            <button onClick={() => router.push('/ai-coach')}
              style={{ background:'#F4F5FA', border:'1px solid #E2E4EC', borderRadius:'10px', padding:'0.4rem 0.85rem', fontSize:'0.75rem', color:'#555', cursor:'pointer', fontWeight:'600', whiteSpace:'nowrap' }}>
              <Bot size={13} style={{ display:'inline', marginRight:'0.3rem' }}/> Ask AI
            </button>
          </div>
          <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-start' }}>
            <MacroRing value={120} max={160} label="Protein" color="#FFE000" unit="g" />
            <MacroRing value={30}  max={80}  label="Carbs"   color="#f87171" unit="g" />
            <MacroRing value={50}  max={70}  label="Healthy Fat" color="#60a5fa" unit="g" />
            <MacroRing value={1400} max={1600} label="Calories" color="#4ade80" unit="cal" />
          </div>
          <p style={{ fontSize:'0.71rem', color:'#CCC', marginTop:'1.1rem', textAlign:'center' }}>
            Send food photos to your AI coach for real-time meal tracking
          </p>
        </div>

        {/* ── Today's tasks ── */}
        <div className="card" style={{ marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <div className="section-title">Today's Tasks</div>
            <span style={{ fontSize:'0.75rem', color:'#888' }}>
              {[checkedInToday, workedOutToday].filter(Boolean).length}/2 done
            </span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <TaskRow done={checkedInToday} label="Daily Check-In" sub="Log your morning weight"
              action={() => router.push('/checkin')} icon={<Camera size={18}/>} />
            <TaskRow done={workedOutToday} label="Log Workout" sub="Record today's session"
              action={() => router.push('/workout')} icon={<Dumbbell size={18}/>} />
          </div>
        </div>

        {/* ── Quick access cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.75rem', marginBottom:'1.25rem' }}>
          {[
            { label:'AI Coach', sub:'Get real feedback', icon:<Bot size={20}/>, color:'rgba(255,224,0,0.15)', iconColor:'#997700', href:'/ai-coach' },
            { label:'Cycle Tracker', sub:'Hormones & cravings', icon:<Heart size={20}/>, color:'rgba(248,113,113,0.12)', iconColor:'#dc2626', href:'/cycle' },
            { label:'Workout Plan', sub:'6 muscle groups', icon:<ListChecks size={20}/>, color:'rgba(96,165,250,0.12)', iconColor:'#2563eb', href:'/plan' },
            { label:'Community', sub:'Share your wins', icon:<Star size={20}/>, color:'rgba(74,222,128,0.12)', iconColor:'#16a34a', href:'/community' },
          ].map(q => (
            <div key={q.href} className="card" onClick={() => router.push(q.href)}
              style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:'0.85rem', padding:'1rem', transition:'box-shadow 0.15s' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:q.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:q.iconColor }}>
                {q.icon}
              </div>
              <div>
                <div style={{ fontWeight:'700', fontSize:'0.88rem' }}>{q.label}</div>
                <div style={{ fontSize:'0.72rem', color:'#999', marginTop:'0.1rem' }}>{q.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent check-ins ── */}
        <div className="card" style={{ marginBottom:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <div className="section-title">Recent Check-Ins</div>
            <button className="btn-ghost" style={{ fontSize:'0.78rem', padding:'0.3rem 0.8rem' }} onClick={() => router.push('/progress')}>
              See all
            </button>
          </div>
          {checkins.length === 0
            ? <div style={{ textAlign:'center', padding:'1.5rem', color:'#CCC' }}>
                <Camera size={32} style={{ margin:'0 auto 0.75rem', color:'#E2E4EC' }}/>
                <p style={{ fontSize:'0.88rem' }}>No check-ins yet. Start today.</p>
              </div>
            : checkins.slice(0,5).map((c, idx) => {
                const prev = checkins[idx + 1]
                const diff = prev ? c.weight - prev.weight : 0
                return (
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'0.75rem 0', borderBottom: idx < 4 ? '1px solid #F4F5FA' : 'none' }}>
                    <div>
                      <div style={{ fontSize:'0.88rem', fontWeight:'600' }}>{c.date}</div>
                      {c.coach_feedback && <div style={{ fontSize:'0.73rem', color:'#888', marginTop:'0.1rem', display:'flex', alignItems:'center', gap:'0.25rem' }}><MessageSquare size={11}/> {c.coach_feedback}</div>}
                    </div>
                    <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <div>
                        <div style={{ fontSize:'1.05rem', fontWeight:'800', color:'#FFE000' }}>{c.weight} kg</div>
                        {prev && <div style={{ fontSize:'0.72rem', color: diff < 0 ? '#16a34a' : diff > 0 ? '#dc2626' : '#888', fontWeight:'600' }}>
                          {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} kg
                        </div>}
                      </div>
                      <span className={`badge badge-${c.reviewed ? 'green' : 'gray'}`}>
                        {c.reviewed ? '✓' : '···'}
                      </span>
                    </div>
                  </div>
                )
              })
          }
        </div>

      </div>
    </div>
  )
}
