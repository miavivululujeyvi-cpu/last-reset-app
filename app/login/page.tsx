'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login, seedDemoData } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')

  useEffect(() => { seedDemoData() }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const user = login(email, password)
    if (!user) { setError('Incorrect email or password.'); return }
    if (user.role === 'admin')  router.replace('/admin')
    else if (user.role === 'coach') router.replace('/coach')
    else router.replace('/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ fontSize:'1rem', color:'#888', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'0.5rem' }}>
            The Last Reset Program
          </div>
          <div style={{ fontSize:'2rem', fontWeight:'800', color:'#FFE000', letterSpacing:'-0.02em' }}>
            LRP
          </div>
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          <h1 style={{ fontSize:'1.4rem', fontWeight:'700', marginBottom:'0.25rem' }}>Welcome back</h1>
          <p style={{ color:'#888', fontSize:'0.9rem', marginBottom:'1.75rem' }}>Sign in to your coaching portal</p>

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.85rem', color:'#888', marginBottom:'0.4rem' }}>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.85rem', color:'#888', marginBottom:'0.4rem' }}>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p style={{ color:'#f87171', fontSize:'0.85rem' }}>{error}</p>}
            <button className="btn-yellow" type="submit" style={{ width:'100%', padding:'0.75rem', fontSize:'1rem', marginTop:'0.5rem' }}>
              Sign In
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="card" style={{ marginTop:'1rem', padding:'1rem' }}>
          <p style={{ fontSize:'0.78rem', color:'#888', marginBottom:'0.6rem', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>Demo accounts</p>
          {[
            { label:'Admin (Jeyvi)', email:'jeyvi@lastresetprogram.com', pass:'admin123' },
            { label:'Coach (Sophia)', email:'sophia@lastresetprogram.com', pass:'coach123' },
            { label:'Client (Jazmine)', email:'jazmine@test.com', pass:'client123' },
            { label:'AI Client (Maria)', email:'maria@test.com', pass:'client123' },
          ].map(d => (
            <button key={d.email} onClick={() => { setEmail(d.email); setPassword(d.pass) }}
              style={{ display:'block', width:'100%', textAlign:'left', background:'transparent', border:'none', color:'#FFE000', fontSize:'0.82rem', padding:'0.3rem 0', cursor:'pointer', fontFamily:'monospace' }}>
              {d.label}: {d.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
