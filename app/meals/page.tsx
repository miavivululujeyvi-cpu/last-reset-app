'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getMealsForClient, addMeal, getUsers } from '@/lib/store'
import { MealLog, MealType } from '@/lib/types'
import { Camera, Star, Clock, ChevronDown, Sunrise, Sun, Moon, Apple } from 'lucide-react'

const MEAL_TYPES: { value: MealType; label: string; time: string }[] = [
  { value: 'breakfast', label: 'Breakfast', time: '6:10am' },
  { value: 'lunch',     label: 'Lunch',     time: '11am:2pm' },
  { value: 'dinner',    label: 'Dinner',    time: '5:9pm' },
  { value: 'snack',     label: 'Snack',     time: 'Any time' },
]

function MealIcon({ type, size = 18, color = 'currentColor' }: { type: MealType; size?: number; color?: string }) {
  const props = { size, style: { color } }
  switch (type) {
    case 'breakfast': return <Sunrise {...props} />
    case 'lunch':     return <Sun {...props} />
    case 'dinner':    return <Moon {...props} />
    case 'snack':     return <Apple {...props} />
    default:          return null
  }
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function ratingColor(r: number) {
  if (r >= 8) return '#16a34a'
  if (r >= 5) return '#f59e0b'
  return '#dc2626'
}

function ratingLabel(r: number) {
  if (r >= 9) return 'Excellent'
  if (r >= 7) return 'Good'
  if (r >= 5) return 'Okay'
  if (r >= 3) return 'Needs work'
  return 'Off plan'
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 900
      let w = img.width, h = img.height
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function MealsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [meals, setMeals] = useState<MealLog[]>([])
  const [selectedType, setSelectedType] = useState<MealType>('breakfast')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filterDate, setFilterDate] = useState<string>('')

  function reload(uid: string) {
    setMeals(getMealsForClient(uid))
  }

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
    reload(s.id)
    // Default meal type by time of day
    const h = new Date().getHours()
    if (h >= 6 && h < 11) setSelectedType('breakfast')
    else if (h >= 11 && h < 15) setSelectedType('lunch')
    else if (h >= 17 && h < 22) setSelectedType('dinner')
    else setSelectedType('snack')
  }, [router])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      setPreview(compressed)
      setShowForm(true)
    } catch { /* ignore */ }
    setUploading(false)
    e.target.value = ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !preview) return
    addMeal(user.id, preview, selectedType, description || undefined)
    setPreview(null)
    setDescription('')
    setShowForm(false)
    reload(user.id)
  }

  if (!user) return null

  const today = new Date().toISOString().split('T')[0]
  const todayMeals = meals.filter(m => m.date === today)
  const filtered = filterDate ? meals.filter(m => m.date === filterDate) : meals

  return (
    <div className="page-main">
      <Nav role="client" />
      <div style={{ padding: '1.5rem', maxWidth: '820px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
            Meal <span style={{ color: '#FFE000' }}>Log</span>
          </h1>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFE000', border: 'none', borderRadius: '12px', padding: '0.7rem 1.1rem', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,224,0,0.35)' }}>
            <Camera size={18} />
            {uploading ? 'Processing...' : 'Log Meal'}
          </button>
        </div>
        <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          Photo every meal. Your coach reviews and rates each one.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Photo preview + form */}
        {showForm && preview && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <img src={preview} alt="Meal preview" style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '10px', marginBottom: '1rem' }} />
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#888', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meal Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {MEAL_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setSelectedType(t.value)}
                      style={{ padding: '0.6rem 0.25rem', borderRadius: '10px', border: '2px solid', borderColor: selectedType === t.value ? '#FFE000' : '#E2E4EC', background: selectedType === t.value ? 'rgba(255,224,0,0.1)' : '#FFFFFF', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                      <MealIcon type={t.value} size={18} />
                      <span style={{ color: selectedType === t.value ? '#1A1A1A' : '#888' }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#888', fontWeight: '600', marginBottom: '0.4rem' }}>What did you eat? <span style={{ color: '#CCC', fontWeight: '400' }}>(optional)</span></label>
                <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Grilled chicken, spinach, avocado" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setPreview(null) }} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-yellow" style={{ flex: 2 }}>Submit Meal ✓</button>
              </div>
            </form>
          </div>
        )}

        {/* Today's summary bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="scroll-hide">
          {MEAL_TYPES.map(t => {
            const logged = todayMeals.some(m => m.meal_type === t.value)
            return (
              <div key={t.value} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', borderRadius: '20px', background: logged ? 'rgba(22,163,74,0.1)' : '#FFFFFF', border: `1px solid ${logged ? 'rgba(22,163,74,0.25)' : '#E2E4EC'}`, fontSize: '0.78rem', fontWeight: '600', color: logged ? '#16a34a' : '#999' }}>
                <MealIcon type={t.value} size={13} color={logged ? '#16a34a' : '#999'} />
                <span>{t.label}</span>
                {logged && <span style={{ fontSize: '0.9rem' }}>✓</span>}
              </div>
            )
          })}
        </div>

        {/* Filter by date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1A1A1A' }}>
            {filterDate ? filterDate : 'All Meals'} <span style={{ color: '#AAA', fontWeight: '400' }}>({filtered.length})</span>
          </span>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ background: '#FFFFFF', border: '1px solid #E2E4EC', borderRadius: '8px', padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: '#555', cursor: 'pointer' }} />
        </div>

        {/* Meal feed */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Camera size={48} style={{ margin: '0 auto 0.75rem', color: '#E2E4EC', display: 'block' }} />
            <p style={{ color: '#888', marginBottom: '1.25rem' }}>No meals logged yet today.</p>
            <p style={{ fontSize: '0.82rem', color: '#BBB' }}>Your coach is watching. Log every meal.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map(meal => {
              const type = MEAL_TYPES.find(t => t.value === meal.meal_type)
              return (
                <div key={meal.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <img src={meal.photo} alt={meal.meal_type} style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MealIcon type={meal.meal_type} size={16} color="#555" />
                          {type?.label}
                        </span>
                        {meal.description && <p style={{ fontSize: '0.82rem', color: '#666', marginTop: '0.2rem' }}>{meal.description}</p>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {meal.rating != null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Star size={14} fill={ratingColor(meal.rating)} color={ratingColor(meal.rating)} />
                              <span style={{ fontWeight: '800', fontSize: '1rem', color: ratingColor(meal.rating) }}>{meal.rating}/10</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: ratingColor(meal.rating) }}>{ratingLabel(meal.rating)}</span>
                          </div>
                        ) : (
                          <span className="badge badge-gray">Pending review</span>
                        )}
                      </div>
                    </div>
                    {meal.coach_note && (
                      <div style={{ background: '#F4F5FA', borderRadius: '8px', padding: '0.6rem 0.75rem', marginTop: '0.5rem', fontSize: '0.82rem', color: '#444', fontStyle: 'italic' }}>
                        Coach: {meal.coach_note}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.6rem', color: '#BBB', fontSize: '0.75rem' }}>
                      <Clock size={12} />
                      {timeAgo(meal.logged_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
