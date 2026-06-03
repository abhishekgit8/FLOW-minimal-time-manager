'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Clock, Target, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useFocusTask } from '@/components/focus-task-provider'

interface Task {
  id: string; name: string; description: string; priority: 'high' | 'medium' | 'low'
  category: string; time_estimate: number; time_spent: number; done: boolean
  created_at: string; completed_at: string | null; sort_order: number
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
  const [user, setUser] = useState<{ id: string } | null>(null)
  const supabase = createClient()
  const { focusTask, setFocusTask } = useFocusTask()

  // Editing state
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPri, setEditPri] = useState<'high' | 'medium' | 'low'>('medium')
  const [editCat, setEditCat] = useState('Work')
  const [editEst, setEditEst] = useState(25)

  // Drag and drop state
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const dragFromGrip = useRef(false)

  const load = async (uid: string) => {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', uid).order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) { setUser(user); load(user.id) } })
  }, [])

  const add = async () => {
    if (!name.trim() || !user) return
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.sort_order ?? 0), -1)
    const { data } = await supabase.from('tasks').insert({
      user_id: user.id, name: name.trim(), description: desc.trim(), priority: pri, category: cat, time_estimate: est, time_spent: 0, done: false, sort_order: maxOrder + 1,
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

  // Edit functions
  const startEdit = (t: Task) => {
    setEditing(t.id)
    setEditName(t.name)
    setEditDesc(t.description)
    setEditPri(t.priority)
    setEditCat(t.category)
    setEditEst(t.time_estimate)
  }

  const saveEdit = async () => {
    if (!editing || !editName.trim()) return
    const { data } = await supabase.from('tasks').update({
      name: editName.trim(), description: editDesc.trim(), priority: editPri, category: editCat, time_estimate: editEst
    }).eq('id', editing).select().single()
    if (data) {
      setTasks(tasks.map(t => t.id === editing ? data : t))
      if (focusTask?.id === editing) setFocusTask({ id: data.id, name: data.name, time_estimate: data.time_estimate })
    }
    setEditing(null)
  }

  const cancelEdit = () => setEditing(null)

  // Drag and drop functions
  const saveOrder = async (reordered: Task[]) => {
    const updates = reordered.map((t, i) =>
      supabase.from('tasks').update({ sort_order: i }).eq('id', t.id)
    )
    const results = await Promise.all(updates)
    const err = results.find(r => r.error)
    if (err) {
      console.error('Save order failed:', err.error?.message)
      return
    }
    setTasks(reordered)
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!dragFromGrip.current) { e.preventDefault(); return }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
    setDragging(taskId)
    dragFromGrip.current = false
  }

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (taskId !== dragging) setDragOver(taskId)
  }

  const handleDragLeave = () => setDragOver(null)

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) { setDragging(null); setDragOver(null); return }
    const reordered = [...tasks]
    const sourceIdx = reordered.findIndex(t => t.id === sourceId)
    const targetIdx = reordered.findIndex(t => t.id === targetId)
    const [moved] = reordered.splice(sourceIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    saveOrder(reordered)
    setDragging(null)
    setDragOver(null)
  }

  const handleDragEnd = () => { setDragging(null); setDragOver(null) }

  // Touch long-press drag
  const handleTouchStart = (e: React.TouchEvent, taskId: string) => {
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    longPressTimer.current = setTimeout(() => {
      setDragging(taskId)
      if (navigator.vibrate) navigator.vibrate(30)
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) {
      if (longPressTimer.current) {
        const touch = e.touches[0]
        if (touchStartPos.current) {
          const dx = Math.abs(touch.clientX - touchStartPos.current.x)
          const dy = Math.abs(touch.clientY - touchStartPos.current.y)
          if (dx > 10 || dy > 10) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
        }
      }
      return
    }
    e.preventDefault()
    const touch = e.touches[0]
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
    const taskRow = elementBelow?.closest('[data-task-id]') as HTMLElement | null
    if (taskRow) {
      const id = taskRow.getAttribute('data-task-id')
      if (id && id !== dragging) setDragOver(id)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    if (dragging && dragOver && dragging !== dragOver) {
      const reordered = [...tasks]
      const sourceIdx = reordered.findIndex(t => t.id === dragging)
      const targetIdx = reordered.findIndex(t => t.id === dragOver)
      const [moved] = reordered.splice(sourceIdx, 1)
      reordered.splice(targetIdx, 0, moved)
      saveOrder(reordered)
    }
    setDragging(null)
    setDragOver(null)
    touchStartPos.current = null
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
            <select value={pri} onChange={e => setPri(e.target.value as 'high' | 'medium' | 'low')}
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

      {dragging && (
        <p style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 12, textAlign: 'center', fontWeight: 500 }}>
          Drop to reorder
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: 'var(--text-dim)' }}>No tasks yet</p>
        ) : filtered.map(t => {
          const focused = focusTask?.id === t.id
          const isEditing = editing === t.id
          const isDragging = dragging === t.id
          const isDragOver = dragOver === t.id

          if (isEditing) {
            return (
              <div key={t.id} style={{ borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--accent)', padding: 14 }}>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, fontSize: 13, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 8 }} />
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} placeholder="Add details..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, fontSize: 12, outline: 'none', resize: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  <select value={editPri} onChange={e => setEditPri(e.target.value as 'high' | 'medium' | 'low')}
                    style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    <option value="high">High Priority</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select>
                  <select value={editCat} onChange={e => setEditCat(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <Clock size={11} style={{ color: 'var(--text-dim)' }} />
                    <input type="number" value={editEst} onChange={e => setEditEst(Number(e.target.value))}
                      style={{ width: 36, fontSize: 11, outline: 'none', background: 'transparent', border: 'none', color: 'var(--text)' }} min={5} step={5} />
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>m</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEdit} style={{ padding: '7px 18px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer' }}>Save</button>
                  <button onClick={cancelEdit} style={{ padding: '7px 14px', borderRadius: 10, fontSize: 12, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )
          }

          return (
            <div key={t.id} data-task-id={t.id}
              draggable
              onDragStart={e => handleDragStart(e, t.id)}
              onDragOver={e => handleDragOver(e, t.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, t.id)}
              onDragEnd={handleDragEnd}
              onTouchStart={e => handleTouchStart(e, t.id)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => startEdit(t)}
              style={{
                borderRadius: 14, background: 'var(--surface)',
                border: `1px solid ${isDragOver ? 'var(--accent)' : focused ? 'var(--accent)' : 'var(--border)'}`,
                opacity: isDragging ? 0.4 : t.done ? 0.5 : 1,
                transition: isDragging ? 'none' : 'opacity 0.2s, border-color 0.2s',
                transform: isDragging ? 'scale(0.98)' : 'none',
                cursor: 'grab',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                <div
                  onMouseDown={() => { dragFromGrip.current = true }}
                  onTouchStart={e => e.stopPropagation()}
                  style={{ cursor: 'grab', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.4 }}
                >
                  <GripVertical size={16} />
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggle(t) }}
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
                    <button onClick={(e) => { e.stopPropagation(); setFocusTask(focused ? null : { id: t.id, name: t.name, time_estimate: t.time_estimate }) }}
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: focused ? 'var(--accent)' : 'transparent', color: focused ? 'var(--bg)' : 'var(--text-dim)', border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer' }}>
                      <Target size={12} />
                    </button>
                  )}
                  {t.description && (
                    <button onClick={(e) => { e.stopPropagation(); setExpanded(expanded === t.id ? null : t.id) }} style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {expanded === t.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); del(t.id) }} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, transition: 'opacity 0.2s' }}
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
