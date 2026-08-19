'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getCheckInsForClient, getWorkoutsForClient } from '@/lib/store'
import { CheckIn, WorkoutLog } from '@/lib/types'
import { Camera, Dumbbell, TrendingUp, CheckCircle, Clock, Bot, Bell } from 'lucide-react'

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
  const weightLost = startWeight && latestWeight ? (startWeight - latestWeight).toFixed(1) : null

  return (
    <div style={{ marginLeft:'220px', minHeight:'100vh', background:'#0D0D0D' }}>
      <Nav role="client" />
      <div style={{ padding:'2rem', maxWidth:'900px' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:'800', marginBottom:'0.25rem' }}>
          Good {getGreeting()}, <span style={{ color:'#FFE000' }}>{user.name}</span>
        </h1>
        <p style={{ color:'#888', marginBottom:'1.25rem' }}>Here is your progress overview.</p>

        {/* AI Coach reminder banner */}
        {!checkedInToday && (
          <div onClick={() => router.push('/ai-coach')}
            style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.85rem 1.1rem', marginBottom:'1.25rem', background:'rgba(255,224,0,0.06)', border:'1px solid rgba(255,224,0,0.2)', borderRadius:'10px', cursor:'pointer', transition:'background 0.15s' }}>
            <Bot size={18} style={{ color:'#FFE000', flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:'700', fontSize:'0.9rem', color:'#FFE000' }}>Your AI Coach is waiting</div>
              <div style={{ fontSize:'0.78rem', color:'#888' }}>You haven't checked in today. Tap to talk to your coach.</div>
            </div>
            <Bell size={14} style={{ color:'#FFE000' }}/>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Day Streak', value:`${streak}`, sub:'consecutive days', icon:<TrendingUp size={20}/> },
            { label:'Current Weight', value: latestWeight ? `${latestWeight} kg` : '—', sub:'last check-in', icon:<CheckCircle size={20}/> },
            { label:'Total Lost', value: weightLost ? `${weightLost} kg` : '—', sub:'since you started', icon:<TrendingUp size={20}/> },
            { label:'Workouts', value:`${workouts.length}`, sub:'total logged', icon:<Dumbbell size={20}/> },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ textAlign:'center' }}>
              <div style={{ color:'#FFE000', marginBottom:'0.5rem', display:'flex', justifyContent:'center' }}>{stat.icon}</div>
              <div style={{ fontSize:'1.6rem', fontWeight:'800', color:'#FFE000' }}>{stat.value}</div>
              <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'0.15rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Today tasks */}
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <h2 style={{ fontWeight:'700', marginBottom:'1rem', fontSize:'1rem' }}>Today's Tasks</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <TaskRow done={checkedInToday} label="Daily Check-In" sub="Log your weight and meals"
              action={() => router.push('/checkin')} icon={<Camera size={16}/>} />
            <TaskRow done={workedOutToday} label="Log Workout" sub="Record your session"
              action={() => router.push('/workout')} icon={<Dumbbell size={16}/>} />
          </div>
        </div>

        {/* Recent check-ins */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h2 style={{ fontWeight:'700', fontSize:'1rem' }}>Recent Check-Ins</h2>
            <button className="btn-ghost" style={{ fontSize:'0.8rem', padding:'0.3rem 0.75rem' }} onClick={() => router.push('/progress')}>
              See all
            </button>
          </div>
          {checkins.length === 0
            ? <p style={{ color:'#666', fontSize:'0.9rem' }}>No check-ins yet. Start today!</p>
            : checkins.slice(0,5).map(c => (
              <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0', borderBottom:'1px solid #2a2a2a' }}>
                <div>
                  <div style={{ fontSize:'0.9rem', fontWeight:'600' }}>{c.date}</div>
                  {c.coach_feedback && <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'0.15rem' }}>Coach: {c.coach_feedback}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'1rem', fontWeight:'700', color:'#FFE000' }}>{c.weight} kg</div>
                  <span className={`badge ${c.reviewed ? 'badge-green' : 'badge-gray'}`} style={{ fontSize:'0.7rem' }}>
                    {c.reviewed ? 'Reviewed' : 'Pending'}
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

function TaskRow({ done, label, sub, action, icon }: { done:boolean; label:string; sub:string; action:()=>void; icon:React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem', background: done ? 'rgba(34,197,94,0.06)' : 'rgba(255,224,0,0.04)', borderRadius:'8px', border:`1px solid ${done ? '#1a3a1a' : '#2a2a1a'}` }}>
      <div style={{ color: done ? '#4ade80' : '#FFE000' }}>{done ? <CheckCircle size={20}/> : icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'0.92rem', fontWeight:'600', color: done ? '#4ade80' : '#e5e5e5' }}>{label}</div>
        <div style={{ fontSize:'0.78rem', color:'#666' }}>{sub}</div>
      </div>
      {!done && <button className="btn-yellow" style={{ fontSize:'0.8rem', padding:'0.4rem 0.9rem' }} onClick={action}>Do it</button>}
      {done && <span className="badge badge-green">Done</span>}
    </div>
  )
}

function calcStreak(checkins: CheckIn[]): number {
  if (!checkins.length) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (checkins.find(c => c.date === ds)) streak++
    else if (i > 0) break
  }
  return streak
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
