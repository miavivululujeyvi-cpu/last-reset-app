'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, addWorkout } from '@/lib/store'
import { Exercise } from '@/lib/types'
import { Plus, Trash2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const EXERCISE_LIBRARY = [
  { name:'Bench Press', group:'Chest' },
  { name:'Incline Dumbbell Press', group:'Chest' },
  { name:'Push-Ups', group:'Chest' },
  { name:'Pull-Ups', group:'Back' },
  { name:'Barbell Row', group:'Back' },
  { name:'Lat Pulldown', group:'Back' },
  { name:'Overhead Press', group:'Shoulders' },
  { name:'Lateral Raises', group:'Shoulders' },
  { name:'Squat', group:'Legs' },
  { name:'Romanian Deadlift', group:'Legs' },
  { name:'Leg Press', group:'Legs' },
  { name:'Lunges', group:'Legs' },
  { name:'Bicep Curls', group:'Arms' },
  { name:'Tricep Pushdown', group:'Arms' },
  { name:'Plank', group:'Core' },
  { name:'Crunches', group:'Core' },
]

type LocalSet = { reps: string; weight: string; unit: 'kg'|'lbs' }
type LocalExercise = { name: string; sets: LocalSet[] }

function emptySet(): LocalSet { return { reps:'', weight:'', unit:'kg' } }
function emptyExercise(name = ''): LocalExercise { return { name, sets:[emptySet()] } }

export default function WorkoutPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [exercises, setExercises] = useState<LocalExercise[]>([emptyExercise()])
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [showLibrary, setShowLibrary] = useState<number|null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
  }, [router])

  if (!user) return null

  function updateExercise(i: number, name: string) {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, name } : ex))
    setShowLibrary(null)
  }

  function addSet(i: number) {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, sets:[...ex.sets, emptySet()] } : ex))
  }

  function removeSet(i: number, si: number) {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, sets: ex.sets.filter((_,j) => j !== si) } : ex))
  }

  function updateSet(i: number, si: number, field: keyof LocalSet, value: string) {
    setExercises(prev => prev.map((ex, idx) => idx === i
      ? { ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) }
      : ex
    ))
  }

  function addExercise() {
    setExercises(prev => [...prev, emptyExercise()])
  }

  function removeExercise(i: number) {
    setExercises(prev => prev.filter((_,idx) => idx !== i))
  }

  function handleSave() {
    const valid = exercises.filter(ex => ex.name.trim())
    if (!valid.length) return
    const data: Exercise[] = valid.map(ex => ({
      name: ex.name,
      sets: ex.sets.filter(s => s.reps || s.weight).map(s => ({
        reps: parseInt(s.reps) || 0,
        weight: parseFloat(s.weight) || 0,
        unit: s.unit,
      }))
    }))
    addWorkout(user.id, data, notes || undefined)
    setSaved(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (saved) {
    return (
      <div style={{ marginLeft:'220px', minHeight:'100vh', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Nav role="client" />
        <div style={{ textAlign:'center' }}>
          <CheckCircle size={56} style={{ color:'#4ade80', margin:'0 auto 1rem' }} />
          <h2 style={{ fontSize:'1.3rem', fontWeight:'700', color:'#4ade80' }}>Workout saved!</h2>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginLeft:'220px', minHeight:'100vh', background:'#0D0D0D' }}>
      <Nav role="client" />
      <div style={{ padding:'2rem', maxWidth:'680px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem' }}>
          <div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>Log Workout</h1>
            <p style={{ color:'#888' }}>Record your session. Be honest with yourself.</p>
          </div>
          <button className="btn-yellow" onClick={handleSave}>Save Workout</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {exercises.map((ex, i) => (
            <div key={i} className="card">
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
                <div style={{ flex:1, position:'relative' }}>
                  <input
                    className="input"
                    value={ex.name}
                    onChange={e => updateExercise(i, e.target.value)}
                    placeholder="Exercise name"
                    onFocus={() => setShowLibrary(i)}
                  />
                  {showLibrary === i && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#1a1a1a', border:'1px solid #333', borderRadius:'6px', zIndex:20, maxHeight:'200px', overflowY:'auto' }}>
                      {EXERCISE_LIBRARY.filter(e => !ex.name || e.name.toLowerCase().includes(ex.name.toLowerCase())).map(e => (
                        <button key={e.name} onClick={() => updateExercise(i, e.name)}
                          style={{ display:'flex', justifyContent:'space-between', width:'100%', padding:'0.6rem 0.9rem', background:'transparent', border:'none', color:'#e5e5e5', cursor:'pointer', textAlign:'left', fontSize:'0.88rem' }}>
                          <span>{e.name}</span>
                          <span style={{ color:'#555', fontSize:'0.78rem' }}>{e.group}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {exercises.length > 1 && (
                  <button onClick={() => removeExercise(i)} style={{ background:'transparent', border:'none', color:'#666', cursor:'pointer', padding:'0.4rem' }}>
                    <Trash2 size={16}/>
                  </button>
                )}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr auto', gap:'0.5rem', alignItems:'center', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'0.75rem', color:'#555', fontWeight:'600' }}>Set</span>
                <span style={{ fontSize:'0.75rem', color:'#555', fontWeight:'600' }}>Reps</span>
                <span style={{ fontSize:'0.75rem', color:'#555', fontWeight:'600' }}>Weight</span>
                <span/>
              </div>

              {ex.sets.map((s, si) => (
                <div key={si} style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr auto', gap:'0.5rem', alignItems:'center', marginBottom:'0.4rem' }}>
                  <span style={{ fontSize:'0.85rem', color:'#FFE000', fontWeight:'700', minWidth:'28px', textAlign:'center' }}>{si+1}</span>
                  <input className="input" type="number" min="0" placeholder="12" value={s.reps}
                    onChange={e => updateSet(i, si, 'reps', e.target.value)}
                    style={{ textAlign:'center', padding:'0.45rem' }} />
                  <div style={{ display:'flex', gap:'0.3rem' }}>
                    <input className="input" type="number" min="0" step="0.5" placeholder="0" value={s.weight}
                      onChange={e => updateSet(i, si, 'weight', e.target.value)}
                      style={{ textAlign:'center', padding:'0.45rem', flex:1 }} />
                    <select value={s.unit} onChange={e => updateSet(i, si, 'unit', e.target.value as 'kg'|'lbs')}
                      style={{ background:'#1a1a1a', border:'1px solid #333', color:'#888', borderRadius:'6px', padding:'0.45rem', fontSize:'0.78rem', cursor:'pointer' }}>
                      <option>kg</option>
                      <option>lbs</option>
                    </select>
                  </div>
                  {ex.sets.length > 1 && (
                    <button onClick={() => removeSet(i, si)} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer' }}>
                      <Trash2 size={14}/>
                    </button>
                  )}
                  {ex.sets.length === 1 && <span/>}
                </div>
              ))}

              <button onClick={() => addSet(i)}
                style={{ display:'flex', alignItems:'center', gap:'0.35rem', background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:'0.82rem', padding:'0.4rem 0', marginTop:'0.4rem' }}>
                <Plus size={14}/> Add Set
              </button>
            </div>
          ))}
        </div>

        <button onClick={addExercise} className="btn-ghost"
          style={{ width:'100%', marginTop:'1rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
          <Plus size={16}/> Add Exercise
        </button>

        <div style={{ marginTop:'1.5rem' }}>
          <label style={{ display:'block', fontSize:'0.85rem', color:'#888', marginBottom:'0.4rem' }}>Workout Notes (optional)</label>
          <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="How did it go? Energy level, what was hard, what felt good..."
            rows={3} style={{ resize:'none' }} />
        </div>

        <button className="btn-yellow" onClick={handleSave}
          style={{ width:'100%', padding:'0.9rem', fontSize:'1rem', marginTop:'1.5rem' }}>
          Save Workout
        </button>
      </div>
    </div>
  )
}
