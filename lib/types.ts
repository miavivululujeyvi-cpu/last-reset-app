export type UserRole = 'client' | 'coach' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Client extends User {
  role: 'client'
  coach_id?: string
  start_date?: string
  goal_weight?: number
  current_weight?: number
}

export interface Coach extends User {
  role: 'coach'
  clients?: Client[]
}

export interface CheckIn {
  id: string
  client_id: string
  date: string
  weight: number
  meal_photos: string[]
  notes?: string
  coach_feedback?: string
  reviewed: boolean
  created_at: string
}

export interface WorkoutLog {
  id: string
  client_id: string
  date: string
  exercises: Exercise[]
  notes?: string
  created_at: string
}

export interface Exercise {
  name: string
  sets: Set[]
}

export interface Set {
  reps: number
  weight: number
  unit: 'kg' | 'lbs'
}

export interface ClockEntry {
  id: string
  coach_id: string
  client_id: string
  clock_in: string
  clock_out?: string
  duration_minutes?: number
}

export interface Message {
  id: string
  from_id: string
  to_id: string
  content: string
  created_at: string
  read: boolean
}

export interface WorkoutExercise {
  id: string
  name: string
  muscle_group: string
  youtube_url: string
  description: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  image_url?: string
  likes: string[]
  created_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type PlanType = 'human' | 'ai'
