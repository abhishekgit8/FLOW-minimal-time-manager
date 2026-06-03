'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Target, Flame, Clock, CheckCircle } from 'lucide-react'
import { useFocusTask } from '@/components/focus-task-provider'

interface Stats {
  focusToday: number; sessionsToday: number; tasksDone: number; tasksTotal: number
  streak: number; totalFocus: number; weekly: number[]
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({ focusToday: 0, sessionsToday: 0, tasksDone: 0, tasksTotal: 0, streak: 0, totalFocus: 0, weekly: [0,0,0,0,0,0,0] })
  const [quickTask, setQuickTask] = useState('')
  const [user, setUser] = useState<any>(null)
  const [greeting, setGreeting] = useState('')
  const supabase = createClient()
  const { focusTask } = useFocusTask()

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) { setUser(user); fetchStats(user.id) }
    }
    init()
  }, [])

  const fetchStats = async (uid: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const [sessRes, taskRes] = await Promise.all([
      supabase.from('pomodoro_sessions').select('duration, completed_at').eq('user_id', uid),
      supabase.from('tasks').select('done, created_at').eq('user_id', uid),
    ])
    const sessions = sessRes.data || []
    const tasks = taskRes.data || []
    const todaySessions = sessions.filter(s => new Date(s.completed_at) >= today)
    const focusToday = todaySessions.reduce((a, s) => a + (s.duration || 0), 0)
    const totalFocus = sessions.reduce((a, s) => a + (s.duration || 0), 0)
    const weekly = [0,0,0,0,0,0,0]
    const dow = now.getDay(); const mo = dow === 0 ? 6 : dow - 1
    sessions.forEach(s => {
      const d = new Date(s.completed_at)
      const diff = Math.floor((today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 864e5)
      if (diff >= 0 && diff <= 6) weekly[6 - ((mo - diff + 7) % 7)] += s.duration || 0
    })
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const check = new Date(today.getTime() - i * 864e5)
      if (sessions.some(s => new Date(s.completed_at).toDateString() === check.toDateString())) streak++
      else if (i > 0) break
    }
    setStats({ focusToday, sessionsToday: todaySessions.length, tasksDone: tasks.filter(t => t.done).length, tasksTotal: tasks.length, streak, totalFocus, weekly })
  }

  const addQuickTask = async () => {
    if (!quickTask.trim() || !user) return
    await supabase.from('tasks').insert({ user_id: user.id, name: quickTask.trim(), priority: 'medium', category: 'Work', time_estimate: 25, time_spent: 0, done: false })
    setQuickTask('')
    fetchStats(user.id)
  }

  const h = Math.floor(stats.focusToday / 60)
  const m = stats.focusToday % 60
  const th = Math.floor(stats.totalFocus / 60)
  const tm = stats.totalFocus % 60
  const days = ['M','T','W','T','F','S','S']
  const maxW = Math.max(...stats.weekly, 1)
  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()
  const score = Math.min(100, Math.round((stats.sessionsToday * 20) + (stats.tasksDone * 5) + (stats.streak * 3) + (stats.focusToday / 10)))

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{greeting}, {firstName}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          {stats.focusToday > 0 ? `You've focused ${h}h ${m}m today` : 'Ready to focus?'}
        </p>
      </div>

      {/* Quick Task Input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input type="text" placeholder="Add a quick task..." value={quickTask} onChange={e => setQuickTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addQuickTask()}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 13, outline: 'none', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        <button onClick={addQuickTask}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <Plus size={18} />
        </button>
      </div>

      {/* Focus Task Banner */}
      {focusTask && (
        <div style={{ padding: '10px 14px', borderRadius: 12, marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Focusing on: {focusTask.name}</span>
        </div>
      )}

      {/* Focus Score */}
      <div style={{ padding: 20, borderRadius: 16, marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 12 }}>Focus Score</p>
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 10px' }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ring-bg)" strokeWidth="5" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ring-progress)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - score / 100)} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 300, color: 'var(--text)' }}>{score}</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {score >= 80 ? 'Great focus today!' : score >= 40 ? 'Keep going!' : 'Start a session to boost your score'}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard icon={<Clock size={16} />} value={`${h}h ${m}m`} label="Focus Today" />
        <StatCard icon={<Target size={16} />} value={stats.sessionsToday.toString()} label="Sessions" info="Each completed focus timer counts as 1 session" />
        <StatCard icon={<CheckCircle size={16} />} value={`${stats.tasksDone}/${stats.tasksTotal}`} label="Tasks" />
        <StatCard icon={<Flame size={16} />} value={stats.streak.toString()} label="Streak" />
      </div>

      {/* Weekly Chart */}
      <div style={{ padding: 16, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>This Week</p>
          <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>Total: {th}h {tm}m</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 60, gap: 6 }}>
          {stats.weekly.map((v, i) => {
            const height = Math.max((v / maxW) * 100, 4)
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${height}%`, background: i === todayIdx ? 'var(--accent)' : 'var(--border)' }} />
                <span style={{ fontSize: 10, fontWeight: 500, color: i === todayIdx ? 'var(--text)' : 'var(--text-dim)' }}>{days[i]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, info }: { icon: React.ReactNode; value: string; label: string; info?: string }) {
  const [showTip, setShowTip] = useState(false)
  return (
    <div style={{ padding: 16, borderRadius: 16, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: 'var(--text-dim)' }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2, color: 'var(--text-dim)', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {info && (
          <span style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ cursor: 'help', opacity: 0.5 }}>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 7v4M8 5.5v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {showTip && (
              <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 400, whiteSpace: 'nowrap', background: 'var(--text)', color: 'var(--bg)', zIndex: 10, pointerEvents: 'none' }}>
                {info}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
