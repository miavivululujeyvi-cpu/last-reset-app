'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, addCheckIn, getCheckInsForClient } from '@/lib/store'
import { CheckIn } from '@/lib/types'
import { CheckCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react'

export default function CheckInPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [todayEntry, setTodayEntry] = useState<CheckIn | null>(null)
  const [checkins, setCheckins] = useState<CheckIn[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
    const today = new Date().toISOString().split('T')[0]
    const all = getCheckInsForClient(s.id)
    setCheckins(all)
    const existing = all.find(c => c.date === today) || null
    setTodayEntry(existing)
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !weight) return
    addCheckIn(user.id, parseFloat(weight), notes || undefined)
    setSubmitted(true)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  if (!user) return null

  if (submitted) {
    return (
      <div className="page-main" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <Nav role="client" />
        <div style={{ textAlign:'center', padding:'2rem' }}>
          <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'rgba(34,197,94,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
            <CheckCircle size={40} style={{ color:'#16a34a' }} />
          </div>
          <h2 style={{ fontSize:'1.4rem', fontWeight:'800', color:'#16a34a', marginBottom:'0.5rem' }}>Check-in saved!</h2>
          <p style={{ color:'#888' }}>Great job. Your coach will review it.</p>
        </div>
      </div>
    )
  }

  if (todayEntry) {
    const prev = checkins[1]
    const diff = prev ? todayEntry.weight - prev.weight : 0
    return (
      <div className="page-main">
        <Nav role="client" />
        <div style={{ padding:'1.5rem', maxWidth:'540px' }}>
          <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'1.5rem' }}>
            Daily <span style={{ color:'#FFE000' }}>Check-In</span>
          </h1>
          <div className="card" style={{ textAlign:'center', padding:'2.5rem' }}>
            <div style={{ width:'70px', height:'70px', borderRadius:'50%', background:'rgba(34,197,94,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
              <CheckCircle size={36} style={{ color:'#16a34a' }} />
            </div>
            <p style={{ color:'#888', fontSize:'0.88rem', marginBottom:'0.5rem' }}>This morning's weight</p>
            <div style={{ fontSize:'2.5rem', fontWeight:'800', color:'#FFE000', marginBottom:'0.5rem' }}>
              {todayEntry.weight} <span style={{ fontSize:'1.2rem', color:'#AAA', fontWeight:'400' }}>kg</span>
            </div>
            {prev && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', marginBottom:'1.5rem' }}>
                {diff < 0
                  ? <><TrendingDown size={16} style={{ color:'#16a34a' }}/><span style={{ fontSize:'0.85rem', color:'#16a34a', fontWeight:'600' }}>{diff.toFixed(1)} kg from yesterday</span></>
                  : diff > 0
                  ? <><TrendingUp size={16} style={{ color:'#dc2626' }}/><span style={{ fontSize:'0.85rem', color:'#dc2626', fontWeight:'600' }}>+{diff.toFixed(1)} kg from yesterday</span></>
                  : <><Minus size={16} style={{ color:'#888' }}/><span style={{ fontSize:'0.85rem', color:'#888' }}>Same as yesterday</span></>
                }
              </div>
            )}
            <button className="btn-ghost" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  const lastWeight = checkins[0]?.weight
  const weightNum = parseFloat(weight)
  const preview = lastWeight && weightNum ? weightNum - lastWeight : null

  return (
    <div className="page-main">
      <Nav role="client" />
      <div style={{ padding:'1.5rem', maxWidth:'540px' }}>

        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>
          Daily <span style={{ color:'#FFE000' }}>Check-In</span>
        </h1>
        <p style={{ color:'#888', marginBottom:'1.75rem', fontSize:'0.88rem' }}>
          Weigh yourself first thing in the morning, before eating or drinking.
        </p>

        {/* Last weight reference */}
        {lastWeight && (
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem', marginBottom:'1.25rem',
            background:'rgba(255,224,0,0.07)', border:'1px solid rgba(255,224,0,0.2)', borderRadius:'14px' }}>
            <div style={{ fontSize:'0.82rem', color:'#888' }}>Yesterday's weight</div>
            <div style={{ marginLeft:'auto', fontSize:'1.1rem', fontWeight:'800', color:'#FFE000' }}>{lastWeight} kg</div>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

            {/* Weight input — large and prominent */}
            <div style={{ textAlign:'center' }}>
              <label style={{ display:'block', fontSize:'0.8rem', color:'#888', marginBottom:'0.75rem', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Today's Weight (kg)
              </label>
              <div style={{ position:'relative', display:'inline-flex', alignItems:'baseline', gap:'0.5rem' }}>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="00.0"
                  required
                  style={{ width:'160px', fontSize:'3rem', fontWeight:'800', textAlign:'center', color:'#1A1A1A',
                    background:'transparent', border:'none', outline:'none', borderBottom:'3px solid #FFE000',
                    paddingBottom:'0.25rem', fontFamily:'inherit' }}
                />
                <span style={{ fontSize:'1.2rem', color:'#AAA', fontWeight:'400' }}>kg</span>
              </div>
              {/* Live comparison */}
              {preview !== null && !isNaN(preview) && (
                <div style={{ marginTop:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
                  {preview < 0
                    ? <><TrendingDown size={16} style={{ color:'#16a34a' }}/><span style={{ fontSize:'0.88rem', color:'#16a34a', fontWeight:'700' }}>{preview.toFixed(1)} kg since last check-in 🎉</span></>
                    : preview > 0
                    ? <><TrendingUp size={16} style={{ color:'#f97316' }}/><span style={{ fontSize:'0.88rem', color:'#f97316', fontWeight:'700' }}>+{preview.toFixed(1)} kg since last check-in</span></>
                    : <span style={{ fontSize:'0.85rem', color:'#888' }}>Same as last check-in</span>
                  }
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label style={{ display:'block', fontSize:'0.82rem', color:'#888', marginBottom:'0.5rem', fontWeight:'600' }}>
                How do you feel today? <span style={{ color:'#CCC', fontWeight:'400' }}>(optional)</span>
              </label>
              <textarea
                className="input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Energy, sleep quality, cravings, wins, struggles..."
                rows={3}
                style={{ resize:'none' }}
              />
            </div>

            {/* Rules reminder */}
            <div style={{ background:'#F4F5FA', borderRadius:'12px', padding:'1rem', display:'flex', gap:'0.75rem' }}>
              <div style={{ fontSize:'1.2rem', flexShrink:0 }}>💧</div>
              <p style={{ fontSize:'0.78rem', color:'#666', lineHeight:'1.6', margin:0 }}>
                <strong>Program rule:</strong> 3 liters of water today. Zero sugar. If you struggle, message your AI coach immediately.
              </p>
            </div>

            <button className="btn-yellow" type="submit" disabled={!weight}
              style={{ width:'100%', padding:'1rem', fontSize:'1rem', fontWeight:'800', opacity: !weight ? 0.5 : 1 }}>
              Submit Check-In ✓
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
