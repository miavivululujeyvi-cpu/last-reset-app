'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, seedDemoData } from '@/lib/store'

export default function Root() {
  const router = useRouter()
  useEffect(() => {
    seedDemoData()
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    if (session.role === 'admin')  router.replace('/admin')
    else if (session.role === 'coach') router.replace('/coach')
    else router.replace('/dashboard')
  }, [router])
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh' }}>
      <div style={{ color:'#FFE000',fontSize:'1.2rem' }}>Loading...</div>
    </div>
  )
}
