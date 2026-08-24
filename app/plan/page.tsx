'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getVideoUrls } from '@/lib/store'
import { Play, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react'

const WORKOUT_PLAN: { group: string; color: string; exercises: { name: string; sets: number; reps: number }[] }[] = [
  {
    group: 'Legs',
    color: '#FFE000',
    exercises: [
      { name: 'Squats', sets: 3, reps: 8 },
      { name: 'Deadlifts', sets: 3, reps: 8 },
      { name: 'Lunges', sets: 3, reps: 8 },
      { name: 'Hip Thrust', sets: 3, reps: 8 },
      { name: 'Leg Extensions', sets: 3, reps: 8 },
      { name: 'Leg Press', sets: 3, reps: 8 },
    ],
  },
  {
    group: 'Back',
    color: '#60a5fa',
    exercises: [
      { name: 'Pull-Ups', sets: 3, reps: 8 },
      { name: 'Back Extensions', sets: 3, reps: 8 },
    ],
  },
  {
    group: 'Chest',
    color: '#f87171',
    exercises: [
      { name: 'Push-Ups', sets: 3, reps: 8 },
      { name: 'Bench Press', sets: 3, reps: 8 },
    ],
  },
  {
    group: 'Shoulders',
    color: '#c084fc',
    exercises: [
      { name: 'Shoulder Raises', sets: 3, reps: 8 },
    ],
  },
  {
    group: 'Arms',
    color: '#4ade80',
    exercises: [
      { name: 'Bicep Curls', sets: 3, reps: 8 },
      { name: 'Tricep Pushdown', sets: 3, reps: 8 },
    ],
  },
  {
    group: 'Core',
    color: '#fb923c',
    exercises: [
      { name: 'Plank', sets: 3, reps: 8 },
    ],
  },
]

const COMPLETED_KEY = 'lrp_plan_completed'

function getCompleted(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(COMPLETED_KEY) || '{}') } catch { return {} }
}

function saveCompleted(data: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(data))
}

export default function PlanPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [videos, setVideos] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
    setCompleted(getCompleted())
    setVideos(getVideoUrls())
  }, [router])

  function toggleComplete(key: string) {
    setCompleted(prev => {
      const next = { ...prev, [key]: !prev[key] }
      saveCompleted(next)
      return next
    })
  }

  function toggleGroup(group: string) {
    setExpanded(prev => prev === group ? null : group)
    setActiveVideo(null)
  }

  function getYouTubeId(url: string) {
    const m = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)
    return m ? m[1] : null
  }

  if (!user) return null

  const totalExercises = WORKOUT_PLAN.flatMap(g => g.exercises).length
  const totalCompleted = WORKOUT_PLAN.flatMap(g => g.exercises).filter(e => completed[e.name]).length

  return (
    <div className="page-main">
      <Nav role="client" />
      <div style={{ padding:'2rem', maxWidth:'740px' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>Workout Plan</h1>
        <p style={{ color:'#888', marginBottom:'1.5rem' }}>Strength Training: 3 sets × 8 reps per exercise</p>

        {/* Progress bar */}
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.6rem' }}>
            <span style={{ fontSize:'0.85rem', color:'#888' }}>Today's progress</span>
            <span style={{ fontWeight:'700', color:'#FFE000' }}>{totalCompleted}/{totalExercises}</span>
          </div>
          <div style={{ background:'#E2E4EC', borderRadius:'20px', height:'8px', overflow:'hidden' }}>
            <div style={{ background:'#FFE000', height:'100%', width:`${(totalCompleted / totalExercises) * 100}%`, borderRadius:'20px', transition:'width 0.3s' }}/>
          </div>
          {totalCompleted === totalExercises && (
            <p style={{ fontSize:'0.85rem', color:'#4ade80', marginTop:'0.75rem', fontWeight:'600', textAlign:'center' }}>
              Full workout complete. You showed up today.
            </p>
          )}
        </div>

        {/* Groups */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {WORKOUT_PLAN.map(group => {
            const groupCompleted = group.exercises.filter(e => completed[e.name]).length
            const isOpen = expanded === group.group
            return (
              <div key={group.group} className="card" style={{ padding:0, overflow:'hidden' }}>
                {/* Group header */}
                <button onClick={() => toggleGroup(group.group)}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:group.color, flexShrink:0 }}/>
                    <span style={{ fontWeight:'700', fontSize:'1rem', color:'#1A1A1A' }}>{group.group}</span>
                    <span style={{ fontSize:'0.78rem', color:'#555' }}>{group.exercises.length} exercises</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <span style={{ fontSize:'0.82rem', color: groupCompleted === group.exercises.length ? '#4ade80' : '#888', fontWeight:'600' }}>
                      {groupCompleted}/{group.exercises.length}
                    </span>
                    {isOpen ? <ChevronUp size={16} color="#555"/> : <ChevronDown size={16} color="#555"/>}
                  </div>
                </button>

                {/* Exercises */}
                {isOpen && (
                  <div style={{ borderTop:'1px solid #E2E4EC' }}>
                    {group.exercises.map((ex, i) => {
                      const done = !!completed[ex.name]
                      const hasVideo = !!videos[ex.name]
                      const isVideoOpen = activeVideo === ex.name
                      const ytId = hasVideo ? getYouTubeId(videos[ex.name]) : null
                      return (
                        <div key={ex.name} style={{ borderBottom: i < group.exercises.length - 1 ? '1px solid #EEEEEE' : 'none' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.9rem 1.25rem' }}>
                            {/* Checkbox */}
                            <button onClick={(e) => { e.stopPropagation(); toggleComplete(ex.name) }}
                              style={{ background:'transparent', border:'none', cursor:'pointer', flexShrink:0, padding:0, color: done ? '#4ade80' : '#444', transition:'color 0.15s' }}>
                              {done ? <CheckCircle size={22}/> : <Circle size={22}/>}
                            </button>

                            {/* Info */}
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:'600', fontSize:'0.95rem', color: done ? '#AAAAAA' : '#1A1A1A', textDecoration: done ? 'line-through' : 'none', transition:'all 0.15s' }}>
                                {ex.name}
                              </div>
                              <div style={{ fontSize:'0.78rem', color:'#555' }}>{ex.sets} sets × {ex.reps} reps</div>
                            </div>

                            {/* Video button */}
                            {hasVideo && ytId ? (
                              <button onClick={(e) => { e.stopPropagation(); setActiveVideo(isVideoOpen ? null : ex.name) }}
                                style={{ display:'flex', alignItems:'center', gap:'0.35rem', background: isVideoOpen ? '#FFE000' : 'rgba(255,224,0,0.1)', border:'none', borderRadius:'6px', padding:'0.4rem 0.7rem', cursor:'pointer', color: isVideoOpen ? '#0D0D0D' : '#FFE000', fontSize:'0.78rem', fontWeight:'600', transition:'all 0.15s' }}>
                                <Play size={12} fill="currentColor"/> {isVideoOpen ? 'Close' : 'Watch'}
                              </button>
                            ) : (
                              <span style={{ fontSize:'0.72rem', color:'#333', fontStyle:'italic' }}>Video coming</span>
                            )}
                          </div>

                          {/* Embedded video */}
                          {isVideoOpen && ytId && (
                            <div style={{ padding:'0 1.25rem 1rem' }}>
                              <div style={{ position:'relative', paddingBottom:'56.25%', height:0, borderRadius:'8px', overflow:'hidden', background:'#111' }}>
                                <iframe
                                  src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                                  style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop:'1.5rem', padding:'1rem', background:'rgba(255,224,0,0.04)', border:'1px solid rgba(255,224,0,0.1)', borderRadius:'8px' }}>
          <p style={{ fontSize:'0.82rem', color:'#888', lineHeight:'1.5' }}>
            Videos will be added to each exercise. When your coach uploads them, they will appear here automatically. Come back daily and check off your exercises.
          </p>
        </div>
      </div>
    </div>
  )
}
