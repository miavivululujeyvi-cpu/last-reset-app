'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getCheckInsForClient, getWorkoutsForClient } from '@/lib/store'
import { CheckIn, WorkoutLog } from '@/lib/types'

const TOTAL_WEEKS = 12

// ── helpers ───────────────────────────────────────────────────────────────────

function calcStreak(checkins: CheckIn[]): number {
  if (!checkins.length) return 0
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (checkins.find(c => c.date === ds)) streak++
    else if (i > 0) break
  }
  return streak
}

function calcWeekAndDay(checkins: CheckIn[]): { week: number; day: number } {
  if (!checkins.length) return { week: 1, day: 1 }
  const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date))
  const start = new Date(sorted[0].date)
  const now = new Date()
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000))
  const day = days + 1
  const week = Math.min(Math.max(1, Math.ceil(day / 7)), TOTAL_WEEKS)
  return { week, day }
}

function getPhase(week: number): { phase: number; label: string } {
  if (week <= 4)  return { phase: 1, label: 'FOUNDATION' }
  if (week <= 8)  return { phase: 2, label: 'IGNITE' }
  return { phase: 3, label: 'RESET' }
}

function getMilestone(day: number, name: string): string {
  const half = Math.round((TOTAL_WEEKS * 7) / 2)
  if (day === 1)   return `Let's go, ${name}.`
  if (day <= 7)    return `Strong start, ${name}.`
  if (day === half) return `Halfway, ${name}.`
  if (day <= 42)   return `Building habits, ${name}.`
  if (day <= 70)   return `Halfway there, ${name}.`
  if (day <= 80)   return `Almost there, ${name}.`
  return `Last push, ${name}.`
}

function getDayLabel(day: number): string {
  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  return `${weekday} · DAY ${day}`
}

// ── component ─────────────────────────────────────────────────────────────────

const S = {
  page: {
    background: '#F6F6F9',
    minHeight: '100vh',
  } as React.CSSProperties,

  inner: {
    maxWidth: 390,
    margin: '0 auto',
    paddingBottom: 100,
  } as React.CSSProperties,

  // Photo band
  band: {
    position: 'relative',
    width: '100%',
    height: 310,
    background: '#EDEDF1',
    overflow: 'hidden',
  } as React.CSSProperties,

  bandImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    objectPosition: 'center 15%',
    display: 'block',
    mixBlendMode: 'multiply' as const,
  } as React.CSSProperties,

  bandOverlays: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  } as React.CSSProperties,

  pill: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: '#FFE000',
    borderRadius: 99,
    padding: '7px 13px',
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: '0.14em',
    color: '#1A1A1A',
    lineHeight: 1,
  } as React.CSSProperties,

  avatar: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: '#FFFFFF',
    boxShadow: '0 4px 14px rgba(0,0,0,.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 15,
    color: '#1A1A1A',
    overflow: 'hidden',
    cursor: 'pointer',
    pointerEvents: 'auto' as const,
  } as React.CSSProperties,

  // Title block
  titleBlock: {
    paddingTop: 14,
    paddingLeft: 22,
    paddingRight: 22,
    paddingBottom: 0,
  } as React.CSSProperties,

  eyebrow: {
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: '0.2em',
    color: '#8A8A90',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,

  headline: {
    fontWeight: 800,
    fontSize: 30,
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    color: '#1A1A1A',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  // Week bar
  weekBarWrap: {
    paddingLeft: 22,
    paddingRight: 22,
    marginTop: 20,
  } as React.CSSProperties,

  weekBarSegments: {
    display: 'flex',
    gap: 3,
    marginBottom: 7,
  } as React.CSSProperties,

  weekBarCaption: {
    display: 'flex',
    justifyContent: 'space-between',
  } as React.CSSProperties,

  weekCaption: {
    fontWeight: 700,
    fontSize: 9,
    letterSpacing: '0.14em',
    color: '#A9A9B2',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,

  // Section gap
  section: {
    paddingLeft: 22,
    paddingRight: 22,
    marginTop: 12,
  } as React.CSSProperties,

  // Session card
  sessionCard: {
    background: '#FFFFFF',
    borderRadius: 26,
    boxShadow: '0 4px 20px rgba(20,20,40,.06)',
    overflow: 'hidden',
  } as React.CSSProperties,

  sessionBody: {
    display: 'flex',
    gap: 0,
  } as React.CSSProperties,

  sessionText: {
    flex: 1,
    padding: '18px 0 18px 20px',
    minWidth: 0,
  } as React.CSSProperties,

  sessionEyebrow: {
    fontWeight: 700,
    fontSize: 9,
    letterSpacing: '0.14em',
    color: '#A9A9B2',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  } as React.CSSProperties,

  sessionTitle: {
    fontWeight: 800,
    fontSize: 24,
    lineHeight: 1.1,
    letterSpacing: '-0.035em',
    color: '#1A1A1A',
    marginBottom: 8,
  } as React.CSSProperties,

  sessionMeta: {
    fontWeight: 600,
    fontSize: 11,
    color: '#8A8A90',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  sessionSep: {
    color: '#D8D9E0',
    margin: '0 5px',
  } as React.CSSProperties,

  sessionPhoto: {
    width: 92,
    flexShrink: 0,
    background: '#EDEDF1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as React.CSSProperties,

  sessionFooter: {
    display: 'flex',
    gap: 10,
    padding: '0 16px 16px',
  } as React.CSSProperties,

  btnPrimary: {
    flex: 1,
    background: '#FFE000',
    color: '#1A1A1A',
    border: 'none',
    borderRadius: 16,
    padding: '15px 0',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    lineHeight: 1,
  } as React.CSSProperties,

  btnSecondary: {
    background: '#FFFFFF',
    color: '#1A1A1A',
    border: '1px solid #E6E7ED',
    borderRadius: 16,
    padding: '15px 20px',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    lineHeight: 1,
  } as React.CSSProperties,

  // Stat tiles
  tilesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 9,
  } as React.CSSProperties,

  tile: {
    background: '#FFFFFF',
    borderRadius: 20,
    padding: '14px 14px 12px',
    boxShadow: '0 3px 14px rgba(20,20,40,.05)',
  } as React.CSSProperties,

  tileDark: {
    background: '#1A1A1A',
    borderRadius: 20,
    padding: '14px 14px 12px',
    boxShadow: '0 3px 14px rgba(20,20,40,.05)',
  } as React.CSSProperties,

  tileValue: {
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: '-0.03em',
    color: '#1A1A1A',
    lineHeight: 1.1,
  } as React.CSSProperties,

  tileValueDark: {
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: '-0.03em',
    color: '#FFE000',
    lineHeight: 1.1,
  } as React.CSSProperties,

  tileLabel: {
    fontWeight: 700,
    fontSize: 8.5,
    letterSpacing: '0.12em',
    color: '#A9A9B2',
    textTransform: 'uppercase' as const,
    marginTop: 5,
  } as React.CSSProperties,

  tileLabelDark: {
    fontWeight: 700,
    fontSize: 8.5,
    letterSpacing: '0.12em',
    color: 'rgba(255,255,255,.55)',
    textTransform: 'uppercase' as const,
    marginTop: 5,
  } as React.CSSProperties,

  tileDelta: {
    fontWeight: 800,
    fontSize: 10,
    marginTop: 4,
  } as React.CSSProperties,

  // Coach note card
  coachCard: {
    background: '#FFFFFF',
    borderRadius: 26,
    boxShadow: '0 3px 14px rgba(20,20,40,.05)',
    padding: '16px 18px',
  } as React.CSSProperties,

  coachHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  } as React.CSSProperties,

  coachAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#EDEDF1',
    overflow: 'hidden',
    flexShrink: 0,
  } as React.CSSProperties,

  coachName: {
    fontWeight: 800,
    fontSize: 12,
    color: '#1A1A1A',
    lineHeight: 1.2,
  } as React.CSSProperties,

  coachTime: {
    fontWeight: 600,
    fontSize: 10,
    color: '#A9A9B2',
    marginTop: 1,
  } as React.CSSProperties,

  coachBody: {
    fontWeight: 400,
    fontSize: 12.5,
    lineHeight: 1.5,
    color: '#6E6E76',
    marginBottom: 12,
  } as React.CSSProperties,

  replyBtn: {
    background: 'transparent',
    border: '1px solid #E6E7ED',
    borderRadius: 14,
    padding: '8px 18px',
    fontWeight: 700,
    fontSize: 12,
    color: '#1A1A1A',
    cursor: 'pointer',
  } as React.CSSProperties,
}

export default function ClientDashboard() {
  const router = useRouter()
  const [user, setUser]       = useState<any>(null)
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'client') { router.replace('/login'); return }
    setUser(s)
    setCheckins(getCheckInsForClient(s.id))
    setWorkouts(getWorkoutsForClient(s.id))
  }, [router])

  if (!user) return null

  const todayStr = new Date().toISOString().split('T')[0]
  const workedOutToday = workouts.some(w => w.date === todayStr)
  const checkedInToday = checkins.some(c => c.date === todayStr)
  const streak        = calcStreak(checkins)
  const { week, day } = calcWeekAndDay(checkins)
  const weeksLeft     = TOTAL_WEEKS - week
  const { label: phaseLabel } = getPhase(week)
  const firstName     = (user.name as string)?.split(' ')[0] ?? user.name
  const headline      = getMilestone(day, firstName)

  const latestWeight  = checkins[0]?.weight
  const prevWeight    = checkins[1]?.weight
  const weightDiff    = (latestWeight != null && prevWeight != null)
    ? (latestWeight - prevWeight).toFixed(1)
    : null

  // progress bar
  const filledSegs = Math.round((week / TOTAL_WEEKS) * 12)

  const coachMessage = checkedInToday
    ? `Solid check-in today, ${firstName}. Keep that momentum going.`
    : `Don't forget your morning check-in, ${firstName}. Your streak depends on it.`

  return (
    <div className="page-main" style={S.page}>
      <Nav role="client" />

      <div style={S.inner}>

        {/* ── 1. Photo band ─────────────────────────────────── */}
        <div style={S.band}>
          <img
            src="/coach.webp"
            alt="Coach"
            style={S.bandImg}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />

          {/* Overlays — pointer-events: none on wrapper, auto on avatar */}
          <div style={S.bandOverlays}>
            {/* Week pill */}
            <div style={S.pill}>WEEK {week} / {TOTAL_WEEKS}</div>

            {/* User avatar */}
            <button
              style={S.avatar}
              onClick={() => router.push('/profile')}
              aria-label="Profile"
            >
              {firstName[0]?.toUpperCase()}
            </button>
          </div>
        </div>

        {/* ── 2. Title block ─────────────────────────────────── */}
        <div style={S.titleBlock}>
          <div style={S.eyebrow}>{getDayLabel(day)}</div>
          <div style={S.headline}>{headline}</div>
        </div>

        {/* ── 3. Week bar ────────────────────────────────────── */}
        <div style={S.weekBarWrap}>
          <div style={S.weekBarSegments}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 5, borderRadius: 99,
                background: i < filledSegs ? '#1A1A1A' : '#E6E7ED',
              }} />
            ))}
          </div>
          <div style={S.weekBarCaption}>
            <span style={S.weekCaption}>PHASE {getPhase(week).phase} · {phaseLabel}</span>
            <span style={S.weekCaption}>{weeksLeft} WEEKS LEFT</span>
          </div>
        </div>

        {/* ── 4. Session card ────────────────────────────────── */}
        <div style={S.section}>
          <div style={S.sessionCard}>
            <div style={S.sessionBody}>
              {/* Text column */}
              <div style={S.sessionText}>
                <div style={S.sessionEyebrow}>TODAY'S SESSION</div>
                <div style={S.sessionTitle}>Full Body{'\n'}Reset</div>
                <div style={S.sessionMeta}>
                  45 min
                  <span style={S.sessionSep}>·</span>
                  6 groups
                  <span style={S.sessionSep}>·</span>
                  17 sets
                </div>
              </div>

              {/* Photo slot */}
              <div style={S.sessionPhoto}>
                <img
                  src="/workout.jpg"
                  alt="Session"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 30%',
                  }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div style={S.sessionFooter}>
              <button
                style={S.btnPrimary}
                onClick={() => router.push('/workout')}
              >
                {workedOutToday ? 'Logged ✓' : 'Start session'}
              </button>
              <button
                style={S.btnSecondary}
                onClick={() => router.push('/plan')}
              >
                Plan
              </button>
            </div>
          </div>
        </div>

        {/* ── 5. Stat tiles ──────────────────────────────────── */}
        <div style={{ ...S.section, marginTop: 9 }}>
          <div style={S.tilesGrid}>

            {/* Weight */}
            <div style={S.tile}>
              <div style={S.tileValue}>{latestWeight ?? '—'}</div>
              <div style={S.tileLabel}>Weight KG</div>
              {weightDiff != null && (
                <div style={{
                  ...S.tileDelta,
                  color: parseFloat(weightDiff) < 0 ? '#1F9D53'
                       : parseFloat(weightDiff) > 0 ? '#D2603F'
                       : '#9A8500',
                }}>
                  {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} wk
                </div>
              )}
            </div>

            {/* Meals */}
            <div style={S.tile} onClick={() => router.push('/meals')}>
              <div style={S.tileValue}>2/4</div>
              <div style={S.tileLabel}>Meals</div>
              <div style={{ ...S.tileDelta, color: '#9A8500' }}>2 to go</div>
            </div>

            {/* Streak — inverted */}
            <div style={S.tileDark}>
              <div style={S.tileValueDark}>{streak}</div>
              <div style={S.tileLabelDark}>Day Streak</div>
              <div style={{ ...S.tileDelta, color: 'rgba(255,255,255,.4)', fontSize: 9 }}>
                {streak > 0 ? 'keep going' : 'start today'}
              </div>
            </div>

          </div>
        </div>

        {/* ── 6. Coach note card ─────────────────────────────── */}
        <div style={S.section}>
          <div style={S.coachCard}>
            <div style={S.coachHeader}>
              {/* Coach avatar */}
              <div style={S.coachAvatar}>
                <img
                  src="/coach.webp"
                  alt="Coach Jeyvi"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }}
                  onError={e => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                    if (el.parentElement) el.parentElement.style.background = '#FFE000'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.coachName}>Coach Jeyvi</div>
                <div style={S.coachTime}>Today</div>
              </div>
            </div>

            <div style={S.coachBody}>{coachMessage}</div>

            <button style={S.replyBtn} onClick={() => router.push('/checkin')}>
              Reply
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
