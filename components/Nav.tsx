'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { setSession, getSession } from '@/lib/store'
import { Home, Camera, Dumbbell, TrendingUp, Users, MessageSquare, Clock, Settings, LogOut, Globe, ListChecks, Bot, Menu, X, Heart } from 'lucide-react'

interface NavItem { label: string; href: string; icon: React.ReactNode }

const clientNav: NavItem[] = [
  { label:'Dashboard', href:'/dashboard', icon:<Home size={18}/> },
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

  return (
    <>
      {/* Hamburger button — only shows on mobile */}
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
            <div style={{ fontSize:'0.7rem', color:'#888', letterSpacing:'0.12em', textTransform:'uppercase' }}>The Last Reset</div>
            <div style={{ fontSize:'1.3rem', fontWeight:'800', color:'#FFE000', marginTop:'0.1rem' }}>Program</div>
          </div>
          {/* Close button — only shows on mobile */}
          <button onClick={() => setOpen(false)}
            style={{ background:'transparent', border:'none', color:'#AAA', cursor:'pointer', padding:'0.2rem', display:'flex' }}
            className="nav-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Role badge */}
        <div style={{ padding:'0.75rem 1.25rem', borderBottom:'1px solid #EEEEEE' }}>
          <span className={`badge badge-${role === 'admin' ? 'yellow' : role === 'coach' ? 'green' : 'gray'}`}>
            {role.toUpperCase()}
          </span>
          <div style={{ fontSize:'0.82rem', color:'#666', marginTop:'0.3rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user?.name}
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex:1, padding:'0.75rem 0.75rem', overflowY:'auto' }}>
          {items.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href.length > 1)
            return (
              <button key={item.href}
                onClick={() => navigate(item.href)}
                style={{
                  display:'flex', alignItems:'center', gap:'0.6rem',
                  width:'100%', padding:'0.65rem 0.75rem', marginBottom:'0.2rem',
                  background: active ? 'rgba(255,224,0,0.1)' : 'transparent',
                  color: active ? '#1A1A1A' : '#666',
                  border: 'none', borderRadius:'7px', cursor:'pointer',
                  fontSize:'0.88rem', fontWeight: active ? '600' : '400',
                  textAlign:'left', transition:'all 0.15s',
                }}>
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Logout */}
        <div style={{ padding:'0.75rem', borderTop:'1px solid #E2E4EC' }}>
          <button onClick={logout}
            style={{ display:'flex', alignItems:'center', gap:'0.6rem', width:'100%', padding:'0.65rem 0.75rem', background:'transparent', color:'#888', border:'none', borderRadius:'7px', cursor:'pointer', fontSize:'0.88rem' }}>
            <LogOut size={16}/> Sign Out
          </button>
        </div>
      </nav>

      <style>{`
        @media (min-width: 769px) {
          .nav-close-btn { display: none !important; }
        }
      `}</style>
    </>
  )
}
