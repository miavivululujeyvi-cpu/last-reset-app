'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getVideoUrls, setVideoUrl } from '@/lib/store'
import { Play, Check, ExternalLink } from 'lucide-react'

const ALL_EXERCISES = [
  { name:'Squats', group:'Legs' },
  { name:'Deadlifts', group:'Legs' },
  { name:'Lunges', group:'Legs' },
  { name:'Hip Thrust', group:'Legs' },
  { name:'Leg Extensions', group:'Legs' },
  { name:'Leg Press', group:'Legs' },
  { name:'Pull-Ups', group:'Back' },
  { name:'Back Extensions', group:'Back' },
  { name:'Push-Ups', group:'Chest' },
  { name:'Bench Press', group:'Chest' },
  { name:'Shoulder Raises', group:'Shoulders' },
  { name:'Bicep Curls', group:'Arms' },
  { name:'Tricep Pushdown', group:'Arms' },
  { name:'Plank', group:'Core' },
]

export default function AdminVideos() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [videos, setVideos] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [inputVal, setInputVal] = useState('')
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'admin') { router.replace('/login'); return }
    setAdmin(s)
    setVideos(getVideoUrls())
  }, [router])

  function startEdit(name: string) {
    setEditing(name)
    setInputVal(videos[name] || '')
    setSaved(null)
  }

  function saveUrl(name: string) {
    setVideoUrl(name, inputVal.trim())
    setVideos(getVideoUrls())
    setEditing(null)
    setSaved(name)
    setTimeout(() => setSaved(null), 2000)
  }

  function getYouTubeId(url: string) {
    const m = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)
    return m ? m[1] : null
  }

  if (!admin) return null

  const withVideo = ALL_EXERCISES.filter(e => videos[e.name]).length

  return (
    <div className="page-main">
      <Nav role="admin" />
      <div style={{ padding:'2rem', maxWidth:'740px' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>Exercise Videos</h1>
        <p style={{ color:'#888', marginBottom:'0.5rem' }}>Add YouTube links for each exercise. Clients will see the video inside the Workout Plan.</p>
        <p style={{ fontSize:'0.82rem', color:'#555', marginBottom:'2rem' }}>
          {withVideo}/{ALL_EXERCISES.length} exercises have a video
        </p>

        {/* Progress */}
        <div style={{ background:'#222', borderRadius:'20px', height:'6px', overflow:'hidden', marginBottom:'2rem' }}>
          <div style={{ background:'#FFE000', height:'100%', width:`${(withVideo/ALL_EXERCISES.length)*100}%`, borderRadius:'20px', transition:'width 0.3s' }}/>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
          {ALL_EXERCISES.map(ex => {
            const url = videos[ex.name] || ''
            const ytId = url ? getYouTubeId(url) : null
            const isEdit = editing === ex.name
            return (
              <div key={ex.name} className="card" style={{ padding:'1rem 1.25rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <span style={{ fontWeight:'700', fontSize:'0.95rem' }}>{ex.name}</span>
                      <span style={{ fontSize:'0.72rem', color:'#555' }}>{ex.group}</span>
                      {saved === ex.name && <span style={{ fontSize:'0.72rem', color:'#4ade80', fontWeight:'600' }}>Saved!</span>}
                    </div>
                    {!isEdit && url && (
                      <div style={{ fontSize:'0.78rem', color:'#4ade80', marginTop:'0.2rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                        <Check size={12}/> Video added
                      </div>
                    )}
                    {!isEdit && !url && (
                      <div style={{ fontSize:'0.78rem', color:'#444', marginTop:'0.2rem' }}>No video yet</div>
                    )}
                  </div>

                  <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                    {url && ytId && !isEdit && (
                      <a href={url} target="_blank" rel="noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.78rem', color:'#888', textDecoration:'none' }}>
                        <ExternalLink size={12}/>
                      </a>
                    )}
                    {!isEdit && (
                      <button onClick={() => startEdit(ex.name)}
                        className={url ? 'btn-ghost' : 'btn-yellow'}
                        style={{ fontSize:'0.8rem', padding:'0.4rem 0.85rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
                        <Play size={12}/> {url ? 'Change' : 'Add Video'}
                      </button>
                    )}
                  </div>
                </div>

                {isEdit && (
                  <div style={{ marginTop:'0.75rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    <input
                      className="input"
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      placeholder="Paste YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                      autoFocus
                    />
                    {inputVal && getYouTubeId(inputVal) && (
                      <div style={{ fontSize:'0.78rem', color:'#4ade80' }}>
                        Valid YouTube URL detected
                      </div>
                    )}
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <button className="btn-yellow" onClick={() => saveUrl(ex.name)} style={{ fontSize:'0.85rem', padding:'0.5rem 1rem' }}>
                        Save
                      </button>
                      <button className="btn-ghost" onClick={() => setEditing(null)} style={{ fontSize:'0.85rem', padding:'0.5rem 1rem' }}>
                        Cancel
                      </button>
                      {url && (
                        <button onClick={() => { setInputVal(''); saveUrl(ex.name) }}
                          style={{ background:'transparent', border:'none', color:'#f87171', cursor:'pointer', fontSize:'0.82rem', marginLeft:'auto' }}>
                          Remove video
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
