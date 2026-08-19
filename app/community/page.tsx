'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getSession, getPosts, addPost, toggleLike, getUsers } from '@/lib/store'
import { Post, User } from '@/lib/types'
import { Heart, Send, Image } from 'lucide-react'

export default function CommunityPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [userMap, setUserMap] = useState<Record<string, User>>({})
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)

  function reload() {
    setPosts(getPosts())
  }

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/login'); return }
    setUser(s)
    const users = getUsers()
    setUserMap(Object.fromEntries(users.map(u => [u.id, u])))
    reload()
  }, [router])

  function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !user) return
    setPosting(true)
    addPost(user.id, content.trim())
    setContent('')
    reload()
    setPosting(false)
  }

  function handleLike(postId: string) {
    if (!user) return
    toggleLike(postId, user.id)
    reload()
  }

  function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  function roleColor(role: string) {
    if (role === 'admin') return '#FFE000'
    if (role === 'coach') return '#4ade80'
    return '#888'
  }

  function roleBadge(role: string) {
    if (role === 'admin') return 'Coach Jeyvi'
    if (role === 'coach') return 'Coach'
    return 'Member'
  }

  if (!user) return null

  return (
    <div style={{ marginLeft:'220px', minHeight:'100vh', background:'#0D0D0D' }}>
      <Nav role={user.role} />
      <div style={{ padding:'2rem', maxWidth:'680px' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:'800', marginBottom:'0.25rem' }}>Community</h1>
        <p style={{ color:'#888', marginBottom:'2rem' }}>Share your progress. Support each other. We are in this together.</p>

        {/* Create post */}
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <form onSubmit={handlePost}>
            <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', color: roleColor(user.role), fontSize:'1rem', flexShrink:0 }}>
                {user.name[0]}
              </div>
              <textarea
                className="input"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={user.role === 'admin'
                  ? 'Broadcast a message to the whole community...'
                  : 'Share your progress, a win, or encourage someone...'}
                rows={3}
                style={{ resize:'none', flex:1 }}
              />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'0.75rem' }}>
              <button className="btn-yellow" type="submit" disabled={!content.trim() || posting}
                style={{ display:'flex', alignItems:'center', gap:'0.4rem', opacity: !content.trim() ? 0.5 : 1 }}>
                <Send size={14}/> Post
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {posts.length === 0 && (
            <div className="card" style={{ textAlign:'center', padding:'3rem', color:'#555' }}>
              No posts yet. Be the first to share something!
            </div>
          )}
          {posts.map(post => {
            const author = userMap[post.author_id]
            const liked = post.likes.includes(user.id)
            const isAdmin = author?.role === 'admin'
            return (
              <div key={post.id} className="card"
                style={{ borderColor: isAdmin ? 'rgba(255,224,0,0.2)' : '#333',
                  background: isAdmin ? 'rgba(255,224,0,0.03)' : '#222' }}>

                {/* Author row */}
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.9rem' }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', color: roleColor(author?.role || 'client'), fontSize:'1rem', flexShrink:0 }}>
                    {author?.name?.[0] || '?'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <span style={{ fontWeight:'700', fontSize:'0.95rem' }}>{author?.name || 'Unknown'}</span>
                      <span style={{ fontSize:'0.72rem', padding:'0.15rem 0.5rem', borderRadius:'20px', background:'rgba(255,224,0,0.08)', color: roleColor(author?.role || 'client'), fontWeight:'600' }}>
                        {roleBadge(author?.role || 'client')}
                      </span>
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'#555' }}>{timeAgo(post.created_at)}</div>
                  </div>
                </div>

                {/* Content */}
                <p style={{ fontSize:'0.95rem', lineHeight:'1.6', color:'#ddd', marginBottom:'1rem', whiteSpace:'pre-wrap' }}>
                  {post.content}
                </p>

                {/* Actions */}
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', paddingTop:'0.75rem', borderTop:'1px solid #2a2a2a' }}>
                  <button onClick={() => handleLike(post.id)}
                    style={{ display:'flex', alignItems:'center', gap:'0.35rem', background:'transparent', border:'none', cursor:'pointer',
                      color: liked ? '#f87171' : '#555', fontSize:'0.85rem', fontWeight: liked ? '700' : '400', transition:'color 0.15s' }}>
                    <Heart size={16} fill={liked ? '#f87171' : 'none'} stroke={liked ? '#f87171' : '#555'}/>
                    {post.likes.length > 0 && post.likes.length}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
