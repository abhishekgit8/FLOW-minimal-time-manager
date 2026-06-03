'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Clock, Target, ChevronDown, ChevronUp } from 'lucide-react'
import { useFocusTask } from '@/components/focus-task-provider'

interface Task {
  id: string; name: string; description: string; priority: 'high' | 'medium' | 'low'
  category: string; time_estimate: number; time_spent: number; done: boolean
  created_at: string; completed_at: string | null
}

const CATS = ['Work', 'Personal', 'Health', 'Learning', 'Finance', 'Errands']
const CAT_C: Record<string, string> = { Work: '#3b82f6', Personal: '#8b5cf6', Health: '#10b981', Learning: '#f59e0b', Finance: '#6366f1', Errands: '#ec4899' }
const PRI_C: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [pri, setPri] = useState<'high' | 'medium' | 'low'>('medium')
  const [cat, setCat] = useState('Work')
  const [est, setEst] = useState(25)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [showInput, setShowInput] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const { focusTask, setFocusTask } = useFocusTask()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) { setUser(user); load(user.id) } })
  }, [])

  const load = async (uid: string) => {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  const add = async () => {
    if (!name.trim() || !user) return
    const { data } = await supabase.from('tasks').insert({
      user_id: user.id, name: name.trim(), description: desc.trim(), priority: pri, category: cat, time_estimate: est, time_spent: 0, done: false,
    }).select().single()
    if (data) { setTasks([data, ...tasks]); setName(''); setDesc(''); setShowInput(false) }
  }

  const toggle = async (t: Task) => {
    const { data } = await supabase.from('tasks').update({ done: !t.done, completed_at: !t.done ? new Date().toISOString() : null }).eq('id', t.id).select().single()
    if (data) setTasks(tasks.map(x => x.id === t.id ? data : x))
  }

  const del = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
    if (focusTask?.id === id) setFocusTask(null)
  }

  const filtered = tasks.filter(t => filter === 'all' ? true : filter === 'done' ? t.done : !t.done)
  const done = tasks.filter(t => t.done).length

  return (
    <div style={{ paddingBottom: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>Tasks</h1>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)' }}>{done}/{tasks.length} done</p>
        </div>
        <button onClick={() => setShowInput(!showInput)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer' }}>
          <Plus size={14} /> {showInput ? 'Close' : 'Add Task'}
        </button>
      </div>

      {showInput && (
        <div style={{ padding: 16, borderRadius: 16, marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <input type="text" placeholder="What needs to be done?" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()} autoFocus
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 8 }} />
          <textarea placeholder="Add details..." value={desc} onChange={e => setDesc(e.target.value)} rows={2}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 12, outline: 'none', resize: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <select value={pri} onChange={e => setPri(e.target.value as any)}
              style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <option value="high">High Priority</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <select value={cat} onChange={e => setCat(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <Clock size={11} style={{ color: 'var(--text-dim)' }} />
              <input type="number" value={est} onChange={e => setEst(Number(e.target.value))}
                style={{ width: 36, fontSize: 11, outline: 'none', background: 'transparent', border: 'none', color: 'var(--text)' }} min={5} step={5} />
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>m</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={add} style={{ padding: '8px 20px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer' }}>Save Task</button>
            <button onClick={() => { setShowInput(false); setName(''); setDesc('') }}
              style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['all', 'pending', 'done'] as const).map(f => (
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: 'var(--text-dim)' }}>No tasks yet</p>
        ) : filtered.map(t => {
          const focused = focusTask?.id === t.id
          return (
            <div key={t.id} style={{ borderRadius: 14, background: 'var(--surface)', border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`, opacity: t.done ? 0.5 : 1, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                <button onClick={() => toggle(t)}
                  style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${t.done ? 'var(--accent)' : 'var(--border-light)'}`, background: t.done ? 'var(--accent)' : 'transparent', cursor: 'pointer' }}>
                  {t.done && <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 3l3 3 5-5" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" /></svg>}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: t.done ? 'var(--text-dim)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.name}</span>
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: `${CAT_C[t.category]}18`, color: CAT_C[t.category] }}>{t.category}</span>
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: `${PRI_C[t.priority]}18`, color: PRI_C[t.priority] }}>{t.priority}</span>
                  </div>
                  {t.description && expanded === t.id && <p style={{ fontSize: 12, marginTop: 6, color: 'var(--text-dim)' }}>{t.description}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{t.time_estimate}m</span>
                  {!t.done && (
                    <button onClick={() => setFocusTask(focused ? null : { id: t.id, name: t.name, time_estimate: t.time_estimate })}
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: focused ? 'var(--accent)' : 'transparent', color: focused ? 'var(--bg)' : 'var(--text-dim)', border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer' }}>
                      <Target size={12} />
                    </button>
                  )}
                  {t.description && (
                    <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {expanded === t.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  <button onClick={() => del(t.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
