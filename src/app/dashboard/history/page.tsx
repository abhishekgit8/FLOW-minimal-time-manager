'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Calendar, Trash2 } from 'lucide-react'

interface Session { id: string; duration: number; completed_at: string }

const PAGE_SIZE = 50

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadSessions(user.id, 0)
      else setLoading(false)
    })
  }, [])

  const loadSessions = async (uid: string, offset: number) => {
    if (offset > 0) setLoadingMore(true)
    const { data } = await supabase.from('pomodoro_sessions')
      .select('id, duration, completed_at')
      .eq('user_id', uid)
      .order('completed_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    if (data) {
      if (offset === 0) setSessions(data)
      else setSessions(prev => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
    setLoadingMore(false)
  }

  const loadMore = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) loadSessions(user.id, sessions.length)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this session? This cannot be undone.')) return
    const { error } = await supabase.from('pomodoro_sessions').delete().eq('id', id)
    if (!error) setSessions(sessions.filter(s => s.id !== id))
  }

  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const week = new Date(today); week.setDate(week.getDate() - week.getDay() + 1)

  const filtered = sessions.filter(s => {
    const d = new Date(s.completed_at)
    if (filter === 'today') return d >= today
    if (filter === 'week') return d >= week
    return true
  })

  const grouped: Record<string, Session[]> = {}
  filtered.forEach(s => {
    const key = new Date(s.completed_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!grouped[key]) grouped[key] = []; grouped[key].push(s)
  })

  const total = filtered.reduce((a, s) => a + (s.duration || 0), 0)

  if (loading) return (
    <div style={{ paddingBottom: 96 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>History</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 48, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 0.3 } }`}</style>
    </div>
  )

  return (
    <div style={{ paddingBottom: 96 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>History</h1>
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)' }}>
          {filtered.length} sessions · {Math.floor(total / 60)}h {total % 60}m
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['all', 'today', 'week'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
              background: filter === f ? 'var(--accent)' : 'transparent',
              color: filter === f ? 'var(--bg)' : 'var(--text-muted)',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer',
            }}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Clock size={32} style={{ color: 'var(--text-dim)', marginBottom: 12, opacity: 0.5 }} />
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No sessions yet</p>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Start a focus session to see your history</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(grouped).map(([date, list]) => (
            <div key={date}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Calendar size={12} style={{ color: 'var(--text-dim)' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{date}</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{list.length} · {list.reduce((a, s) => a + s.duration, 0)}m</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {list.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <Clock size={14} style={{ color: 'var(--text-dim)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {new Date(s.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{s.duration}m focus</span>
                    <button onClick={() => del(s.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && filter === 'all' && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={loadMore} disabled={loadingMore}
            style={{ padding: '8px 20px', borderRadius: 10, fontSize: 12, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: loadingMore ? 'wait' : 'pointer' }}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
