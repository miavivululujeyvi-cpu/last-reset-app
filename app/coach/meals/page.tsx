'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getAllMeals, getMeals, getUsers, rateMeal } from '@/lib/store'
import { MealLog, User } from '@/lib/types'
import { Star, Clock, ChevronLeft } from 'lucide-react'

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎'
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

export default function CoachMealsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [meals, setMeals] = useState<MealLog[]>([])
  const [userMap, setUserMap] = useState<Record<string, User>>({})
  const [ratingModal, setRatingModal] = useState<{ meal: MealLog } | null>(null)
  const [ratingVal, setRatingVal] = useState(7)
  const [ratingNote, setRatingNote] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterUnrated, setFilterUnrated] = useState(false)

  function reload() {
    const all = getAllMeals()
    setMeals(all)
  }

  useEffect(() => {
    const s = getSession()
    if (!s || (s.role !== 'coach' && s.role !== 'admin')) { router.replace('/login'); return }
    setUser(s)
    const users = getUsers()
    setUserMap(Object.fromEntries(users.map(u => [u.id, u])))
    reload()
  }, [router])

  function openRating(meal: MealLog) {
    setRatingVal(meal.rating ?? 7)
    setRatingNote(meal.coach_note ?? '')
    setRatingModal({ meal })
  }

  function submitRating() {
    if (!ratingModal) return
    rateMeal(ratingModal.meal.id, ratingVal, ratingNote || undefined)
    setRatingModal(null)
    reload()
  }

  if (!user) return null

  const clients = Object.values(userMap).filter(u => u.role === 'client')
  let filtered = meals
  if (filterClient) filtered = filtered.filter(m => m.client_id === filterClient)
  if (filterUnrated) filtered = filtered.filter(m => m.rating == null)

  const unratedCount = meals.filter(m => m.rating == null).length

  return (
    <div className="page-main">
      <Nav role={user.role} />
      <div style={{ padding: '1.5rem', maxWidth: '820px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#888', display: 'flex' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
            Client <span style={{ color: '#FFE000' }}>Meals</span>
          </h1>
          {unratedCount > 0 && (
            <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{unratedCount} to review</span>
          )}
        </div>
        <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.88rem', paddingLeft: '2rem' }}>
          Rate every meal 1–10. Clients see your rating instantly.
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
            style={{ background: '#FFFFFF', border: '1px solid #E2E4EC', borderRadius: '10px', padding: '0.55rem 0.85rem', fontSize: '0.85rem', color: '#444', cursor: 'pointer', flex: 1, minWidth: '140px' }}>
            <option value="">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setFilterUnrated(p => !p)}
            style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', background: filterUnrated ? '#FFE000' : '#FFFFFF', color: filterUnrated ? '#1A1A1A' : '#888', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {filterUnrated ? '✓ Unrated only' : 'Unrated only'}
          </button>
        </div>

        {/* Meal grid */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🍽️</div>
            <p style={{ color: '#888' }}>No meals to review yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filtered.map(meal => {
              const client = userMap[meal.client_id]
              return (
                <div key={meal.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => openRating(meal)}>
                  <div style={{ position: 'relative' }}>
                    <img src={meal.photo} alt={meal.meal_type} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', background: 'rgba(0,0,0,0.55)', borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: '700', color: '#FFFFFF' }}>
                      {MEAL_EMOJI[meal.meal_type]} {meal.meal_type}
                    </div>
                    {meal.rating != null && (
                      <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: ratingColor(meal.rating), borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.82rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Star size={12} fill="#FFFFFF" color="#FFFFFF" />
                        {meal.rating}/10
                      </div>
                    )}
                    {meal.rating == null && (
                      <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: '#dc2626', borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: '700', color: '#FFFFFF' }}>
                        Not rated
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{client?.name || 'Unknown'}</span>
                      <span style={{ fontSize: '0.72rem', color: '#BBB', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={11} />{timeAgo(meal.logged_at)}
                      </span>
                    </div>
                    {meal.description && <p style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.25rem' }}>{meal.description}</p>}
                    {meal.coach_note && <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.35rem', fontStyle: 'italic' }}>{meal.coach_note}</p>}
                    <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#FFE000', fontWeight: '700' }}>
                      {meal.rating == null ? 'Tap to rate →' : 'Tap to update rating →'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Rating modal */}
      {ratingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 env(safe-area-inset-bottom,0px)' }}
          onClick={e => { if (e.target === e.currentTarget) setRatingModal(null) }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: '500px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E2E4EC', margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Rate this meal</h3>
            <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '1.25rem' }}>
              {userMap[ratingModal.meal.client_id]?.name} · {MEAL_EMOJI[ratingModal.meal.meal_type]} {ratingModal.meal.meal_type}
              {ratingModal.meal.description ? ` · ${ratingModal.meal.description}` : ''}
            </p>
            <img src={ratingModal.meal.photo} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.25rem' }} />

            {/* Rating slider */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#888', fontWeight: '600' }}>Rating</span>
                <span style={{ fontSize: '1.6rem', fontWeight: '800', color: ratingColor(ratingVal) }}>{ratingVal}<span style={{ fontSize: '0.9rem', color: '#AAA', fontWeight: '400' }}>/10</span></span>
              </div>
              <input type="range" min={1} max={10} value={ratingVal} onChange={e => setRatingVal(Number(e.target.value))}
                style={{ width: '100%', accentColor: ratingColor(ratingVal) }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#CCC', marginTop: '0.25rem' }}>
                <span>Off plan</span><span>Okay</span><span>Good</span><span>Excellent</span>
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#888', fontWeight: '600', marginBottom: '0.4rem' }}>
                Feedback note <span style={{ fontWeight: '400', color: '#CCC' }}>(optional)</span>
              </label>
              <textarea className="input" rows={2} value={ratingNote} onChange={e => setRatingNote(e.target.value)}
                placeholder="Great protein choice! Watch the portion size next time." style={{ resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-ghost" onClick={() => setRatingModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-yellow" onClick={submitRating} style={{ flex: 2, fontWeight: '800' }}>
                Submit Rating ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
