'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { setSession, getSession } from '@/lib/store'
import { Home, Camera, Dumbbell, TrendingUp, Users, MessageSquare, Clock, Settings, LogOut, Globe, ListChecks, Bot, Menu, X, Heart, UtensilsCrossed } from 'lucide-react'

interface NavItem { label: string; href: string; icon: React.ReactNode }

const clientNav: NavItem[] = [
  { label:'Dashboard', href:'/dashboard', icon:<Home size={18}/> },
  { label:'Meal Log', href:'/meals', icon:<UtensilsCrossed size={18}/> },
  { label:'Check-In', href:'/checkin', icon:<Camera size={18}/> },
  { label:'AI Coach', href:'/ai-coach', icon:<Bot size={18}/> },
  { label:'Workout Plan', href:'/plan', icon:<ListChecks size={18}/> },
  { label:'Log Workout', href:'/workout', icon:<Dumbbell size={18}/> },
  { label:'Progress', href:'/progress', icon:<TrendingUp size={18}/> },
  { label:'Cycle Tracker', href:'/cycle', icon:<Heart size={18}/> },
  { label:'Community', href:'/community', icon:<Globe size={18}/> },
]

const coachNav: NavItem[] = [
  { label:'My Clients', href:'/coach', icon:<Users size={18}/> },
  { label:'Meal Reviews', href:'/coach/meals', icon:<UtensilsCrossed size={18}/> },
  { label:'Community', href:'/community', icon:<Globe size={18}/> },
  { label:'Messages', href:'/coach/messages', icon:<MessageSquare size={18}/> },
  { label:'Clock', href:'/coach/clock', icon:<Clock size={18}/> },
]

const adminNav: NavItem[] = [
  { label:'Overview', href:'/admin', icon:<Home size={18}/> },
  { label:'Clients', href:'/admin/clients', icon:<Users size={18}/> },
  { label:'Coaches', href:'/admin/coaches', icon:<Settings size={18}/> },
  { label:'Community', href:'/community', icon:<Globe size={18}/> },
  { label:'Videos', href:'/admin/videos', icon:<ListChecks size={18}/> },
  { label:'Messages', href:'/admin/messages', icon:<MessageSquare size={18}/> },
]

export default function Nav({ role }: { role: 'client'|'coach'|'admin' }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = getSession()
  const items = role === 'admin' ? adminNav : role === 'coach' ? coachNav : clientNav
  const [open, setOpen] = useState(false)

  function logout() {
    setSession(null)
    router.replace('/login')
  }

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(href) && href.length > 1)
  }

  return (
    <>
      {/* Hamburger — desktop only (hidden on mobile via CSS) */}
      <button className="nav-hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      <div className={`nav-backdrop ${open ? 'nav-open' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <nav className={`nav-sidebar ${open ? 'nav-open' : ''}`}>
        {/* Brand */}
        <div style={{ padding:'1.5rem 1.25rem 1rem', borderBottom:'1px solid #E2E4EC', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:'0.68rem', color:'#AAA', letterSpacing:'0.14em', textTransform:'uppercase' }}>The Last Reset</div>
            <div style={{ fontSize:'1.3rem', fontWeight:'800', color:'#FFE000', marginTop:'0.1rem', letterSpacing:'-0.02em' }}>Program</div>
          </div>
          <button onClick={() => setOpen(false)}
            style={{ background:'transparent', border:'none', color:'#CCC', cursor:'pointer', padding:'0.2rem', display:'flex' }}
            className="nav-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Role badge + name */}
        <div style={{ padding:'0.85rem 1.25rem', borderBottom:'1px solid #EEEEEE' }}>
          <span className={`badge badge-${role === 'admin' ? 'yellow' : role === 'coach' ? 'green' : 'gray'}`}>
            {role.toUpperCase()}
          </span>
          <div style={{ fontSize:'0.85rem', color:'#444', marginTop:'0.35rem', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.name}
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex:1, padding:'0.75rem 0.75rem', overflowY:'auto' }}>
          {items.map(item => {
            const active = isActive(item.href)
            return (
              <button key={item.href}
                onClick={() => navigate(item.href)}
                style={{
                  display:'flex', alignItems:'center', gap:'0.65rem',
                  width:'100%', padding:'0.7rem 0.85rem', marginBottom:'0.15rem',
                  background: active ? 'rgba(255,224,0,0.12)' : 'transparent',
                  color: active ? '#1A1A1A' : '#777',
                  border: 'none', borderRadius:'10px', cursor:'pointer',
                  fontSize:'0.88rem', fontWeight: active ? '700' : '400',
                  textAlign:'left', transition:'all 0.15s',
                }}>
                <span style={{ color: active ? '#FFE000' : 'inherit', display:'flex' }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Logout */}
        <div style={{ padding:'0.75rem', borderTop:'1px solid #E2E4EC' }}>
          <button onClick={logout}
            style={{ display:'flex', alignItems:'center', gap:'0.65rem', width:'100%', padding:'0.7rem 0.85rem', background:'transparent', color:'#999', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'0.88rem' }}>
            <LogOut size={16}/> Sign Out
          </button>
        </div>
      </nav>

      {/* ── Bottom nav — client mobile only ── */}
      {role === 'client' && (
        <nav className="bottom-nav" style={{
          borderTop: '1px solid #ECEDF2',
          padding: '9px 12px 22px',
          height: 'auto',
          gap: 0,
        }}>
          {/* Today */}
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '0 8px',
              color: isActive('/dashboard') ? '#1A1A1A' : '#A9A9B2',
              fontWeight: 800, fontSize: 9, letterSpacing: '0.04em',
            }}>
            <Home size={21} strokeWidth={1.7} />
            Today
          </button>

          {/* Train */}
          <button
            onClick={() => navigate('/plan')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '0 8px',
              color: isActive('/plan') || isActive('/workout') ? '#1A1A1A' : '#A9A9B2',
              fontWeight: 800, fontSize: 9, letterSpacing: '0.04em',
            }}>
            <Dumbbell size={21} strokeWidth={1.7} />
            Train
          </button>

          {/* Center — Check-in FAB */}
          <button
            onClick={() => navigate('/checkin')}
            aria-label="Check-in"
            style={{
              width: 54, height: 54, borderRadius: '50%',
              background: '#FFE000', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 6px 20px rgba(255,224,0,.55)',
            }}>
            <Camera size={22} strokeWidth={1.7} style={{ color: '#1A1A1A' }} />
          </button>

          {/* Progress */}
          <button
            onClick={() => navigate('/progress')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '0 8px',
              color: isActive('/progress') ? '#1A1A1A' : '#A9A9B2',
              fontWeight: 800, fontSize: 9, letterSpacing: '0.04em',
            }}>
            <TrendingUp size={21} strokeWidth={1.7} />
            Progress
          </button>

          {/* Meals */}
          <button
            onClick={() => navigate('/meals')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '0 8px',
              color: isActive('/meals') ? '#1A1A1A' : '#A9A9B2',
              fontWeight: 800, fontSize: 9, letterSpacing: '0.04em',
            }}>
            <UtensilsCrossed size={21} strokeWidth={1.7} />
            Meals
          </button>
        </nav>
      )}

      <style>{`
        @media (min-width: 769px) {
          .nav-close-btn { display: none !important; }
        }
      `}</style>
    </>
  )
}
