'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, addCheckIn, getCheckInsForClient } from '@/lib/store'
import { CheckIn } from '@/lib/types'
import { Scale, CheckCircle } from 'lucide-react'

export default function CheckInPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [todayEntry, setTodayEntry] = useState<CheckIn | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
    const today = new Date().toISOString().split('T')[0]
    const checkins = getCheckInsForClient(s.id)
    const existing = checkins.find(c => c.date === today) || null
    setTodayEntry(existing)
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !weight) return
    addCheckIn(user.id, parseFloat(weight), notes || undefined)
    setSubmitted(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (!user) return null

  if (todayEntry && !submitted) {
    return (
      <div className="page-main">
        <Nav role="client" />
        <div style={{ padding:'2rem', maxWidth:'540px' }}>
          <div className="card" style={{ textAlign:'center', padding:'2.5rem' }}>
            <CheckCircle size={48} style={{ color:'#4ade80', margin:'0 auto 1rem' }} />
            <h2 style={{ fontSize:'1.2rem', fontWeight:'700', marginBottom:'0.5rem' }}>Already checked in today</h2>
            <p style={{ color:'#888', marginBottom:'1.5rem' }}>You logged <strong style={{ color:'#FFE000' }}>{todayEntry.weight} kg</strong> this morning.</p>
            <button className="btn-ghost" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="page-main" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Nav role="client" />
        <div style={{ textAlign:'center' }}>
          <CheckCircle size={56} style={{ color:'#4ade80', margin:'0 auto 1rem' }} />
          <h2 style={{ fontSize:'1.3rem', fontWeight:'700', color:'#4ade80' }}>Check-in saved!</h2>
          <p style={{ color:'#888', marginTop:'0.5rem' }}>Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-main">
      <Nav role="client" />
      <div style={{ padding:'2rem', maxWidth:'540px' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>Daily Check-In</h1>
        <p style={{ color:'#888', marginBottom:'2rem' }}>Log your weight and notes for today.</p>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.85rem', color:'#888', marginBottom:'0.4rem' }}>
                <Scale size={14} style={{ display:'inline', marginRight:'0.4rem' }} />
                Morning Weight (kg)
              </label>
              <input
                className="input"
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="e.g. 78.5"
                required
                style={{ fontSize:'1.5rem', fontWeight:'700', textAlign:'center', color:'#FFE000', letterSpacing:'0.05em' }}
              />
              <p style={{ fontSize:'0.75rem', color:'#555', marginTop:'0.4rem', textAlign:'center' }}>
                Weigh yourself first thing in the morning, before eating or drinking.
              </p>
            </div>

            <div>
              <label style={{ display:'block', fontSize:'0.85rem', color:'#888', marginBottom:'0.4rem' }}>Notes (optional)</label>
              <textarea
                className="input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="How do you feel today? Any struggles or wins?"
                rows={3}
                style={{ resize:'none' }}
              />
            </div>

            <div style={{ background:'rgba(255,224,0,0.05)', border:'1px solid rgba(255,224,0,0.15)', borderRadius:'8px', padding:'1rem' }}>
              <p style={{ fontSize:'0.82rem', color:'#999', lineHeight:'1.5' }}>
                After submitting, your coach will review your check-in and send feedback.
                Stay consistent. Every day counts.
              </p>
            </div>

            <button className="btn-yellow" type="submit" style={{ width:'100%', padding:'0.9rem', fontSize:'1rem' }}>
              Submit Check-In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
