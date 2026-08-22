// Local data store — no backend needed to start. Replace with Supabase calls later.
import { User, CheckIn, WorkoutLog, Message, ClockEntry, Post, AIMessage } from './types'

const USERS_KEY = 'lrp_users'
const CHECKINS_KEY = 'lrp_checkins'
const WORKOUTS_KEY = 'lrp_workouts'
const MESSAGES_KEY = 'lrp_messages'
const CLOCK_KEY = 'lrp_clock'
const SESSION_KEY = 'lrp_session'

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function save<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

function id() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Session ────────────────────────────────────────────────────────────────────
export function getSession(): User | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

export function setSession(user: User | null) {
  if (typeof window === 'undefined') return
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  else localStorage.removeItem(SESSION_KEY)
}

// ── Users ──────────────────────────────────────────────────────────────────────
export function getUsers(): User[] { return load<User>(USERS_KEY) }

export function getUserById(uid: string): User | undefined {
  return getUsers().find(u => u.id === uid)
}

export function login(email: string, password: string): User | null {
  // password stored as plain string in demo — replace with hashed auth later
  const users = getUsers()
  const user = users.find(u => u.email === email && (u as any).password === password)
  if (user) setSession(user)
  return user || null
}

export function createUser(name: string, email: string, password: string, role: User['role'], coach_id?: string): User {
  const users = getUsers()
  const user: User & { password: string; coach_id?: string } = {
    id: id(), name, email, password, role,
    created_at: new Date().toISOString(),
    ...(coach_id ? { coach_id } : {}),
  }
  users.push(user)
  save(USERS_KEY, users)
  return user
}

export function getClients(): User[] { return getUsers().filter(u => u.role === 'client') }
export function getCoaches(): User[] { return getUsers().filter(u => u.role === 'coach') }

export function getClientsForCoach(coachId: string): User[] {
  return getUsers().filter(u => u.role === 'client' && (u as any).coach_id === coachId)
}

// ── Check-ins ──────────────────────────────────────────────────────────────────
export function getCheckIns(): CheckIn[] { return load<CheckIn>(CHECKINS_KEY) }

export function getCheckInsForClient(clientId: string): CheckIn[] {
  return getCheckIns().filter(c => c.client_id === clientId).sort((a, b) => b.date.localeCompare(a.date))
}

export function addCheckIn(clientId: string, weight: number, notes?: string): CheckIn {
  const checkins = getCheckIns()
  const entry: CheckIn = {
    id: id(), client_id: clientId,
    date: new Date().toISOString().split('T')[0],
    weight, meal_photos: [], notes, reviewed: false,
    created_at: new Date().toISOString(),
  }
  checkins.push(entry)
  save(CHECKINS_KEY, checkins)
  return entry
}

export function markReviewed(checkinId: string, feedback: string) {
  const checkins = getCheckIns()
  const i = checkins.findIndex(c => c.id === checkinId)
  if (i !== -1) { checkins[i].reviewed = true; checkins[i].coach_feedback = feedback }
  save(CHECKINS_KEY, checkins)
}

// ── Workouts ───────────────────────────────────────────────────────────────────
export function getWorkouts(): WorkoutLog[] { return load<WorkoutLog>(WORKOUTS_KEY) }

export function getWorkoutsForClient(clientId: string): WorkoutLog[] {
  return getWorkouts().filter(w => w.client_id === clientId).sort((a, b) => b.date.localeCompare(a.date))
}

export function addWorkout(clientId: string, exercises: WorkoutLog['exercises'], notes?: string): WorkoutLog {
  const workouts = getWorkouts()
  const entry: WorkoutLog = {
    id: id(), client_id: clientId,
    date: new Date().toISOString().split('T')[0],
    exercises, notes, created_at: new Date().toISOString(),
  }
  workouts.push(entry)
  save(WORKOUTS_KEY, workouts)
  return entry
}

// ── Messages ───────────────────────────────────────────────────────────────────
export function getMessages(): Message[] { return load<Message>(MESSAGES_KEY) }

export function getConversation(userId: string, otherId: string): Message[] {
  return getMessages()
    .filter(m => (m.from_id === userId && m.to_id === otherId) || (m.from_id === otherId && m.to_id === userId))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function sendMessage(fromId: string, toId: string, content: string): Message {
  const messages = getMessages()
  const msg: Message = {
    id: id(), from_id: fromId, to_id: toId, content,
    created_at: new Date().toISOString(), read: false,
  }
  messages.push(msg)
  save(MESSAGES_KEY, messages)
  return msg
}

// ── Clock entries ──────────────────────────────────────────────────────────────
export function getClockEntries(): ClockEntry[] { return load<ClockEntry>(CLOCK_KEY) }

export function clockIn(coachId: string, clientId: string): ClockEntry {
  const entries = getClockEntries()
  const entry: ClockEntry = {
    id: id(), coach_id: coachId, client_id: clientId,
    clock_in: new Date().toISOString(),
  }
  entries.push(entry)
  save(CLOCK_KEY, entries)
  return entry
}

export function clockOut(entryId: string) {
  const entries = getClockEntries()
  const i = entries.findIndex(e => e.id === entryId)
  if (i !== -1) {
    entries[i].clock_out = new Date().toISOString()
    const ms = new Date(entries[i].clock_out!).getTime() - new Date(entries[i].clock_in).getTime()
    entries[i].duration_minutes = Math.round(ms / 60000)
  }
  save(CLOCK_KEY, entries)
}

export function getActiveClockEntry(coachId: string): ClockEntry | undefined {
  return getClockEntries().find(e => e.coach_id === coachId && !e.clock_out)
}

// ── AI Conversations ───────────────────────────────────────────────────────────
const AI_CONV_KEY = 'lrp_ai_conv'

export function getAIMessages(clientId: string): AIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const all = JSON.parse(localStorage.getItem(AI_CONV_KEY) || '{}')
    return all[clientId] || []
  } catch { return [] }
}

export function saveAIMessage(clientId: string, msg: AIMessage) {
  if (typeof window === 'undefined') return
  const all = JSON.parse(localStorage.getItem(AI_CONV_KEY) || '{}')
  if (!all[clientId]) all[clientId] = []
  all[clientId].push(msg)
  localStorage.setItem(AI_CONV_KEY, JSON.stringify(all))
}

export function clearAIMessages(clientId: string) {
  if (typeof window === 'undefined') return
  const all = JSON.parse(localStorage.getItem(AI_CONV_KEY) || '{}')
  delete all[clientId]
  localStorage.setItem(AI_CONV_KEY, JSON.stringify(all))
}

// ── Cycle tracker ─────────────────────────────────────────────────────────────
const CYCLE_KEY = 'lrp_cycle'

export function getCycleData(clientId: string): { last_period: string; cycle_length: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const all = JSON.parse(localStorage.getItem(CYCLE_KEY) || '{}')
    return all[clientId] || null
  } catch { return null }
}

export function saveCycleData(clientId: string, last_period: string, cycle_length: number) {
  if (typeof window === 'undefined') return
  const all = JSON.parse(localStorage.getItem(CYCLE_KEY) || '{}')
  all[clientId] = { last_period, cycle_length }
  localStorage.setItem(CYCLE_KEY, JSON.stringify(all))
}

// ── Community posts ────────────────────────────────────────────────────────────
const POSTS_KEY = 'lrp_posts'
const VIDEOS_KEY = 'lrp_videos'

export function getPosts(): Post[] {
  return load<Post>(POSTS_KEY).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function addPost(authorId: string, content: string, imageUrl?: string): Post {
  const posts = load<Post>(POSTS_KEY)
  const post: Post = {
    id: id(), author_id: authorId, content,
    image_url: imageUrl, likes: [],
    created_at: new Date().toISOString(),
  }
  posts.push(post)
  save(POSTS_KEY, posts)
  return post
}

export function toggleLike(postId: string, userId: string) {
  const posts = load<Post>(POSTS_KEY)
  const i = posts.findIndex(p => p.id === postId)
  if (i === -1) return
  const li = posts[i].likes.indexOf(userId)
  if (li === -1) posts[i].likes.push(userId)
  else posts[i].likes.splice(li, 1)
  save(POSTS_KEY, posts)
}

// ── Video URLs ─────────────────────────────────────────────────────────────────
export function getVideoUrls(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(VIDEOS_KEY) || '{}') } catch { return {} }
}

export function setVideoUrl(exerciseName: string, url: string) {
  const videos = getVideoUrls()
  videos[exerciseName] = url
  if (typeof window !== 'undefined') localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos))
}

// ── Seed demo data ─────────────────────────────────────────────────────────────
export function seedDemoData() {
  if (getUsers().length > 0) return
  const admin = createUser('Coach Jeyvi', 'jeyvi@lastresetprogram.com', 'admin123', 'admin')
  const coach1 = createUser('Sophia Joseph', 'sophia@lastresetprogram.com', 'coach123', 'coach')
  const coach2 = createUser('Sara', 'sara@lastresetprogram.com', 'coach123', 'coach')
  const c1 = createUser('Jazmine', 'jazmine@test.com', 'client123', 'client', coach1.id)
  const c2 = createUser('Shameya', 'shameya@test.com', 'client123', 'client', coach1.id)
  const c3 = createUser('Valencia', 'valencia@test.com', 'client123', 'client', coach2.id)
  const c4 = createUser('Emir', 'emir@test.com', 'client123', 'client', coach2.id)
  // AI plan demo client
  const aiClient = createUser('Maria', 'maria@test.com', 'client123', 'client')
  const users = getUsers()
  const idx = users.findIndex(u => u.id === aiClient.id)
  if (idx !== -1) { (users[idx] as any).plan_type = 'ai' }
  save(USERS_KEY, users)

  // sample community posts
  const posts = load<Post>(POSTS_KEY)
  posts.push(
    { id: id(), author_id: admin.id, content: 'Welcome to The Last Reset Program community! This is your space to share progress, celebrate wins, and support each other. You are not alone on this journey. Let\'s go!', likes: [c1.id, c2.id], created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: id(), author_id: c1.id, content: 'Day 7 done! Can\'t believe how much energy I have now. The sugar detox was hard the first 3 days but now I feel incredible. Coach Jeyvi this program is life changing!', likes: [admin.id, coach1.id, c2.id], created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: id(), author_id: coach1.id, content: 'Proud of all my clients this week. Every single one of you showed up. That\'s the Last Reset mindset. Keep pushing!', likes: [admin.id, c1.id, c2.id], created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
  )
  save(POSTS_KEY, posts)

  // sample check-ins
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const checkins = load<CheckIn>(CHECKINS_KEY)
    checkins.push({
      id: id(), client_id: c1.id, date: dateStr,
      weight: 82 - i * 0.3, meal_photos: [], reviewed: i > 0,
      coach_feedback: i > 0 ? 'Great job staying on track!' : undefined,
      created_at: d.toISOString(),
    })
    save(CHECKINS_KEY, checkins)
  }
}
