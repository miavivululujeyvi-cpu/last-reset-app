'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getCycleData, saveCycleData } from '@/lib/store'
import { Droplets, Leaf, Zap, AlertCircle } from 'lucide-react'

const PHASES = [
  {
    name: 'Menstrual',
    days: [1, 5],
    color: '#f87171',
    risk: 'Moderate Risk',
    riskColor: '#f87171',
    summary: 'Your body is shedding. Energy is low and iron drops. Cravings for sugar and comfort food are real.',
    tips: [
      'Increase iron: eat red meat, spinach, lentils',
      'Stay away from sugar even if the craving is intense',
      'Drink more water than usual: 3.5 liters minimum',
      'Rest more but still move: light walks count',
    ],
  },
  {
    name: 'Follicular',
    days: [6, 13],
    color: '#4ade80',
    risk: 'Low Risk',
    riskColor: '#4ade80',
    summary: 'Estrogen is rising. Energy comes back. This is your strongest phase for discipline and sticking to the diet.',
    tips: [
      'Best time to start a new habit or reset',
      'Push harder in workouts: your body recovers faster',
      'Lean proteins and vegetables will feel easy now',
      'Take advantage of this window: it does not last long',
    ],
  },
  {
    name: 'Ovulation',
    days: [14, 16],
    color: '#FFE000',
    risk: 'Lowest Risk',
    riskColor: '#FFE000',
    summary: 'Peak estrogen. You feel your best. Mood is high, energy is high, discipline is easiest.',
    tips: [
      'Hardest workouts of the month go here',
      'Social energy is up: great time for accountability calls',
      'Your body burns more calories naturally right now',
      'Protein intake is most effective during this phase',
    ],
  },
  {
    name: 'Luteal',
    days: [17, 28],
    color: '#f97316',
    risk: 'HIGHEST RISK',
    riskColor: '#f97316',
    summary: 'Progesterone rises. PMS begins. Cravings for sugar and carbs are the strongest of the month. This is where most women fall off their diet.',
    tips: [
      'Plan your meals ahead: do NOT rely on willpower',
      'Sugar cravings are hormonal, not weakness. Eat berries instead',
      'Bloating is normal: do not panic about the scale',
      'Sleep more: 8 hours minimum to control cortisol',
      'Tell your coach if you are struggling: this phase is the hardest',
    ],
  },
]

function getPhase(day: number, cycleLength: number) {
  const lutealStart = cycleLength - 11
  if (day <= 5) return PHASES[0]
  if (day <= 13) return PHASES[1]
  if (day <= 16) return PHASES[2]
  return PHASES[3]
}

function getDayOfCycle(lastPeriod: string): number {
  const start = new Date(lastPeriod)
  const today = new Date()
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return (diff % 28) + 1
}

function PhaseIcon({ name, color, size = 18 }: { name: string; color: string; size?: number }) {
  const props = { size, style: { color } }
  switch (name) {
    case 'Menstrual':  return <Droplets {...props} />
    case 'Follicular': return <Leaf {...props} />
    case 'Ovulation':  return <Zap {...props} />
    case 'Luteal':     return <AlertCircle {...props} />
    default:           return null
  }
}

export default function CyclePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [lastPeriod, setLastPeriod] = useState('')
  const [cycleLength, setCycleLength] = useState(28)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
    const data = getCycleData(s.id)
    if (data) {
      setLastPeriod(data.last_period)
      setCycleLength(data.cycle_length)
      setSaved(true)
    } else {
      setEditing(true)
    }
  }, [router])

  function handleSave() {
    if (!lastPeriod || !user) return
    saveCycleData(user.id, lastPeriod, cycleLength)
    setSaved(true)
    setEditing(false)
  }

  if (!user) return null

  const cycleDay = saved ? getDayOfCycle(lastPeriod) : null
  const currentPhase = cycleDay ? getPhase(cycleDay, cycleLength) : null
  const daysUntilNext = cycleDay ? cycleLength - cycleDay : null

  return (
    <div className="page-main">
      <Nav role="client" />
      <div style={{ padding: '2rem', maxWidth: '700px' }}>

        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.25rem' }}>
          Cycle <span style={{ color: '#FFE000' }}>Tracker</span>
        </h1>
        <p style={{ color: '#888', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
          Your hormones affect your cravings, energy, and diet. Know where you are in your cycle so you can prepare and not fail.
        </p>

        {/* Setup form */}
        {(editing || !saved) && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '1rem' }}>Set up your cycle</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '0.4rem' }}>
                  First day of your last period
                </label>
                <input className="input" type="date" value={lastPeriod}
                  onChange={e => setLastPeriod(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '0.4rem' }}>
                  Average cycle length: <strong style={{ color: '#FFE000' }}>{cycleLength} days</strong>
                </label>
                <input type="range" min={21} max={35} value={cycleLength}
                  onChange={e => setCycleLength(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#FFE000' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  <span>21 days</span><span>28 days</span><span>35 days</span>
                </div>
              </div>
              <button className="btn-yellow" onClick={handleSave} disabled={!lastPeriod}
                style={{ opacity: !lastPeriod ? 0.5 : 1 }}>
                Save
              </button>
            </div>
          </div>
        )}

        {/* Current status */}
        {saved && !editing && cycleDay && currentPhase && (
          <>
            {/* Today card */}
            <div className="card" style={{ marginBottom: '1.5rem', border: `2px solid ${currentPhase.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: currentPhase.color }}>Day {cycleDay}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: `${currentPhase.color}22`, color: currentPhase.color, padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                    {currentPhase.risk}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
                    {daysUntilNext} days until next period
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PhaseIcon name={currentPhase.name} color={currentPhase.color} />
                {currentPhase.name} Phase
              </div>
              <p style={{ color: '#666', fontSize: '0.88rem', lineHeight: '1.55' }}>{currentPhase.summary}</p>
              <button onClick={() => setEditing(true)}
                style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: '#555', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}>
                Edit cycle settings
              </button>
            </div>

            {/* Cycle bar */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '1rem' }}>Your {cycleLength}-day cycle</h2>
              <div style={{ position: 'relative', height: '48px', borderRadius: '8px', overflow: 'hidden', display: 'flex', marginBottom: '0.75rem' }}>
                {PHASES.map((phase, i) => {
                  const [start, end] = phase.days
                  const effectiveEnd = i === 3 ? cycleLength : end
                  const width = ((effectiveEnd - start + 1) / cycleLength) * 100
                  return (
                    <div key={phase.name} style={{ width: `${width}%`, background: `${phase.color}22`, borderRight: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: phase.color, fontWeight: '600', flexShrink: 0 }}>
                      {phase.name.slice(0, 3)}
                    </div>
                  )
                })}
                {/* Today marker */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${((cycleDay - 0.5) / cycleLength) * 100}%`,
                  width: '3px', background: '#1A1A1A', borderRadius: '2px',
                  boxShadow: '0 0 6px rgba(0,0,0,0.3)'
                }} />
              </div>
              {/* Phase labels */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {PHASES.map(phase => (
                  <div key={phase.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#888' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: phase.color }} />
                    {phase.name} (Day {phase.days[0]}{phase.name === 'Luteal' ? ` to ${cycleLength}` : ` to ${phase.days[1]}`})
                  </div>
                ))}
              </div>
            </div>

            {/* Tips for current phase */}
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: `4px solid ${currentPhase.color}` }}>
              <h2 style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.75rem', color: currentPhase.color }}>
                What to do right now ({currentPhase.name} Phase)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {currentPhase.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentPhase.color, marginTop: '0.45rem', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.88rem', color: '#444', lineHeight: '1.5' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All phases overview */}
            <h2 style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Full cycle overview</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {PHASES.map((phase, i) => {
                const [start, end] = phase.days
                const effectiveEnd = i === 3 ? cycleLength : end
                const isActive = phase.name === currentPhase.name
                return (
                  <div key={phase.name} className="card" style={{ border: isActive ? `2px solid ${phase.color}` : '1px solid #E0E0EC', opacity: isActive ? 1 : 0.7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <PhaseIcon name={phase.name} color={phase.color} />
                        {phase.name} Phase
                        {isActive && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: `${phase.color}22`, color: phase.color, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>YOU ARE HERE</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Day {start} to {effectiveEnd}</div>
                        <div style={{ fontSize: '0.72rem', color: phase.riskColor, fontWeight: '600' }}>{phase.risk}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#888', lineHeight: '1.5', margin: 0 }}>{phase.summary}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
