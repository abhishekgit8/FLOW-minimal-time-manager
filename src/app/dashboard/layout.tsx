'use client'

import { useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, ListTodo, Clock, User, Settings, X, Minus, Maximize2, Minimize2, Calendar } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { FocusTaskProvider, useFocusTask } from '@/components/focus-task-provider'
import { ErrorBoundary } from '@/components/error-boundary'

export default function DashLayout({ children }: { children: ReactNode }) {
  return <FocusTaskProvider><Inner>{children}</Inner></FocusTaskProvider>
}

function Inner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else { setUser(user); setLoading(false) }
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const tabs = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/dashboard/history', label: 'History', icon: Clock },
  ]
  const isActive = (h: string) => h === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(h)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="desktop-nav" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 24, paddingTop: 12, paddingBottom: 12, position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', background: 'color-mix(in srgb, var(--bg) 85%, transparent)' }}>
        <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 4, color: 'var(--text)', textDecoration: 'none' }}>FLOW</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 9999, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <Link key={t.href} href={t.href} style={{
              display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16, paddingRight: 16, paddingTop: 6, paddingBottom: 6, borderRadius: 9999, fontSize: 12, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s',
              background: isActive(t.href) ? 'var(--accent)' : 'transparent',
              color: isActive(t.href) ? (isDark ? '#0a0a0a' : '#fff') : 'var(--text-muted)',
            }}>
              <t.icon size={14} /> {t.label}
            </Link>
          ))}
        </div>
        <Link href="/dashboard/settings" style={{ padding: 8, borderRadius: 8, color: pathname === '/dashboard/settings' ? 'var(--text)' : 'var(--text-dim)', background: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center' }}><Settings size={16} /></Link>
      </nav>

      <div style={{ maxWidth: 512, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ paddingTop: 16 }}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </div>

      <TimerWidget userId={user?.id} />

      <nav className="mobile-nav" style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, justifyContent: 'space-around', alignItems: 'center', paddingTop: 8, paddingBottom: 'max(8px, env(safe-area-inset-bottom))', paddingLeft: 8, paddingRight: 8, background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <Link key={t.href} href={t.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12, borderRadius: 12, textDecoration: 'none',
            color: isActive(t.href) ? 'var(--text)' : 'var(--text-dim)',
          }}>
            <t.icon size={20} strokeWidth={isActive(t.href) ? 2.5 : 1.5} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{t.label}</span>
          </Link>
        ))}
        <Link href="/dashboard/settings" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12, borderRadius: 12, textDecoration: 'none', color: pathname === '/dashboard/settings' ? 'var(--text)' : 'var(--text-dim)' }}>
          <Settings size={20} strokeWidth={pathname === '/dashboard/settings' ? 2.5 : 1.5} /><span style={{ fontSize: 10, fontWeight: 500 }}>Settings</span>
        </Link>
      </nav>

      <style>{`
        @media (min-width: 768px) { .desktop-nav { display: flex !important; } .mobile-nav { display: none !important; } }
        @media (max-width: 767px) { .mobile-nav { display: flex !important; } .desktop-nav { display: none !important; } }
      `}</style>
    </div>
  )
}

/* ===== TIMER WIDGET ===== */
function TimerWidget({ userId }: { userId: string }) {
  const [breakMin, setBreakMin] = useState(5)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [inputMin, setInputMin] = useState('25')
  const [inputSec, setInputSec] = useState('00')
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [running, setRunning] = useState(false)
  const [view, setView] = useState<'widget' | 'minimized' | 'hidden' | 'fullscreen'>('widget')
  const ref = useRef<NodeJS.Timeout | null>(null)
  const tickRef = useRef<number>(0)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { focusTask, setFocusTask } = useFocusTask()

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [addToCalendar, setAddToCalendar] = useState(false)
  const [calendarMsg, setCalendarMsg] = useState('')
  const calendarMsgRef = useRef<NodeJS.Timeout | null>(null)
  const modeRef = useRef(mode)
  const inputMinRef = useRef(inputMin)
  const userIdRef = useRef(userId)
  const justCompletedRef = useRef(false)
  const breakMinRef = useRef(breakMin)

  // Persist timer state
  const persistTimer = (data: { timeLeft: number; inputMin: string; inputSec: string; mode: 'focus' | 'break'; running: boolean; breakMin: number }) => {
    try { localStorage.setItem('flow_timer', JSON.stringify(data)) } catch {}
  }

  // Restore timer state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('flow_timer')
      if (saved) {
        const d = JSON.parse(saved)
        if (d.running && d.endTime && Date.now() < d.endTime) {
          const elapsed = Math.floor((d.endTime - Date.now()) / 1000)
          setTimeLeft(Math.max(0, d.timeLeft - (d.timeLeft - elapsed)))
          setMode(d.mode)
          setInputMin(d.inputMin)
          setInputSec(d.inputSec)
          if (d.breakMin) { setBreakMin(d.breakMin); breakMinRef.current = d.breakMin }
          setRunning(true)
        } else {
          setTimeLeft(d.timeLeft || 25 * 60)
          setMode(d.mode || 'focus')
          setInputMin(d.inputMin || '25')
          setInputSec(d.inputSec || '00')
          if (d.breakMin) { setBreakMin(d.breakMin); breakMinRef.current = d.breakMin }
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])
  useEffect(() => { inputMinRef.current = inputMin }, [inputMin])
  useEffect(() => { userIdRef.current = userId }, [userId])
  useEffect(() => { breakMinRef.current = breakMin }, [breakMin])

  // Calendar status check
  useEffect(() => {
    const check = () => fetch('/api/calendar/status').then(r => r.json()).then(d => {
      setCalendarConnected(prev => {
        if (prev && !d.connected) setAddToCalendar(false)
        return d.connected
      })
    }).catch(() => setCalendarConnected(false))
    check()
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [focusTask?.id])

  useEffect(() => {
    if (focusTask) {
      const saved = localStorage.getItem(`flow_cal_${focusTask.id}`)
      setAddToCalendar(!!saved)
    } else {
      setAddToCalendar(false)
    }
    setCalendarMsg('')
  }, [focusTask?.id])

  const toggleAddToCalendar = async () => {
    const next = !addToCalendar
    if (!focusTask) return

    if (next) {
      setAddToCalendar(true)
      const duration = parseInt(inputMin) || 25
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: focusTask.name, startTime: new Date().toISOString(), duration }),
      })
      const data = await res.json()
      if (data.eventId) {
        localStorage.setItem(`flow_cal_${focusTask.id}`, data.eventId)
        setCalendarMsg('Added to calendar')
      } else {
        setAddToCalendar(false)
        setCalendarMsg(data.error || 'Failed to add')
      }
    } else {
      const eventId = localStorage.getItem(`flow_cal_${focusTask.id}`)
      if (eventId) {
        const res = await fetch('/api/calendar/events', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        })
        const data = await res.json()
        if (data.success) {
          localStorage.removeItem(`flow_cal_${focusTask.id}`)
          setAddToCalendar(false)
          setCalendarMsg('Removed from calendar')
        } else {
          setCalendarMsg(data.error || 'Failed to remove')
        }
      } else {
        setAddToCalendar(false)
      }
    }
    if (calendarMsgRef.current) clearTimeout(calendarMsgRef.current)
    calendarMsgRef.current = setTimeout(() => setCalendarMsg(''), 2000)
  }

  useEffect(() => () => { if (calendarMsgRef.current) clearTimeout(calendarMsgRef.current) }, [])

  const totalTime = mode === 'focus' ? (parseInt(inputMin) || 25) * 60 + (parseInt(inputSec) || 0) : breakMin * 60

  // Timer with drift correction
  useEffect(() => {
    if (running && timeLeft > 0) {
      tickRef.current = Date.now()
      ref.current = setInterval(() => {
        const now = Date.now()
        const drift = Math.floor((now - tickRef.current) / 1000)
        tickRef.current = now
        setTimeLeft(p => {
          const next = p - Math.max(1, drift)
          if (next <= 0) {
            clearInterval(ref.current!)
            setRunning(false)
            justCompletedRef.current = true
            persistTimer({ timeLeft: 0, inputMin: inputMinRef.current, inputSec: '00', mode: modeRef.current, running: false, breakMin: breakMinRef.current })
            return 0
          }
          document.title = `${fmt(next)} — Flow`
          return next
        })
      }, 1000)
    }
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [running])

  // Persist on state change
  useEffect(() => {
    if (!running && !justCompletedRef.current) {
      persistTimer({ timeLeft, inputMin, inputSec, mode, running: false, breakMin })
    }
  }, [timeLeft, inputMin, inputSec, mode, breakMin])

  useEffect(() => {
    if (running) persistTimer({ timeLeft, inputMin, inputSec, mode, running: true, breakMin })
  }, [running])

  // Pause on page hide
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden' && running) {
        persistTimer({ timeLeft, inputMin, inputSec, mode, running: true, breakMin })
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [running, timeLeft, inputMin, inputSec, mode, breakMin])

  // Completion effect
  useEffect(() => {
    if (!justCompletedRef.current) return
    justCompletedRef.current = false
    const currentMode = modeRef.current
    const currentUserId = userIdRef.current
    const currentInputMin = inputMinRef.current
    const currentBreakMin = breakMinRef.current
    document.title = 'Flow — Time Manager'
    if (currentMode === 'focus' && currentUserId) {
      const s = createClient()
      const mins = parseInt(currentInputMin) || 25
      s.from('pomodoro_sessions').insert({ user_id: currentUserId, duration: mins, completed_at: new Date().toISOString() })
    }
    if (currentMode === 'focus') {
      setMode('break')
      setTimeLeft(currentBreakMin * 60)
      setInputMin(String(currentBreakMin))
      setInputSec('00')
    } else {
      const m = parseInt(currentInputMin) || 25
      setMode('focus')
      setTimeLeft(m * 60)
      setInputMin(String(m))
      setInputSec('00')
    }
    localStorage.removeItem('flow_timer')
  }, [timeLeft])

  const toggle = () => {
    if (running) {
      setRunning(false); document.title = 'Flow — Time Manager'
    } else {
      setRunning(true)
    }
  }

  const reset = () => {
    setRunning(false)
    document.title = 'Flow — Time Manager'
    if (mode === 'focus') {
      const m = parseInt(inputMin) || 25
      setTimeLeft(m * 60)
    } else {
      setTimeLeft(breakMin * 60)
      setInputMin(String(breakMin))
      setInputSec('00')
    }
    localStorage.removeItem('flow_timer')
  }

  const applyTimeInput = (mStr: string, sStr: string) => {
    if (running) return
    const m = Math.max(0, Math.min(999, parseInt(mStr) || 0))
    const s = Math.max(0, Math.min(59, parseInt(sStr) || 0))
    setInputMin(String(m))
    setInputSec(String(s).padStart(2, '0'))
    setTimeLeft(m * 60 + s)
  }

  const switchMode = (m: 'focus' | 'break') => {
    if (running) return
    setMode(m)
    if (m === 'focus') {
      const mins = parseInt(inputMin) || 25
      setTimeLeft(mins * 60)
    } else {
      setTimeLeft(breakMin * 60)
    }
  }

  const progress = timeLeft / totalTime
  const R = 42
  const circ = 2 * Math.PI * R

  // Drag
  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (view === 'fullscreen') return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragRef.current = { startX: clientX, startY: clientY, startPosX: pos.x, startPosY: pos.y }
    setDragging(true)
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      setPos({ x: dragRef.current.startPosX + (clientX - dragRef.current.startX), y: dragRef.current.startPosY + (clientY - dragRef.current.startY) })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp) }
  }, [dragging])

  // Fullscreen timer display
  if (view === 'fullscreen') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 32 }}>
        <button onClick={() => setView('widget')} style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer' }}>
          <Minimize2 size={18} />
        </button>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface)' }}>
          {(['focus', 'break'] as const).map(m => (
            <button key={m} onClick={() => switchMode(m)} disabled={running}
              style={{
                padding: '8px 24px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? (isDark ? '#0a0a0a' : '#fff') : 'var(--text-dim)',
                cursor: running ? 'not-allowed' : 'pointer',
              }}>
              {m === 'focus' ? 'Focus' : 'Break'}
            </button>
          ))}
        </div>

        {/* Focus task */}
        {focusTask && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{focusTask.name}</p>}

        {/* Timer ring */}
        <div style={{ position: 'relative', width: 280, height: 280 }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--ring-bg)" strokeWidth="2.5" />
            <circle cx="50" cy="50" r={R} fill="none" stroke={mode === 'focus' ? 'var(--accent)' : 'var(--text-dim)'} strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className={running ? 'timer-running' : ''} style={{ fontSize: 72, fontWeight: 200, letterSpacing: 4, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{fmt(timeLeft)}</span>
          </div>
        </div>

        {/* Direct time input */}
        {!running && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={inputMin} onChange={e => applyTimeInput(e.target.value, inputSec)} disabled={running}
              style={{ width: 64, height: 44, textAlign: 'center', borderRadius: 10, fontSize: 22, fontWeight: 300, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} min={0} max={999} />
            <span style={{ fontSize: 28, fontWeight: 200, color: 'var(--text-dim)' }}>:</span>
            <input type="number" value={inputSec} onChange={e => applyTimeInput(inputMin, e.target.value)} disabled={running}
              style={{ width: 64, height: 44, textAlign: 'center', borderRadius: 10, fontSize: 22, fontWeight: 300, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} min={0} max={59} />
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={toggle}
            style={{ padding: '14px 48px', borderRadius: 9999, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: running ? 'var(--text)' : 'var(--accent)', color: running ? 'var(--bg)' : (isDark ? '#0a0a0a' : '#fff') }}>
            {running ? 'Pause' : 'Start'}
          </button>
          <button onClick={reset}
            style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'none', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
          </button>
        </div>
      </div>
    )
  }

  // Hidden — floating dot
  if (view === 'hidden') {
    return (
      <button onClick={() => setView('widget')}
        style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 60, width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', color: isDark ? '#0a0a0a' : '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
        {fmt(timeLeft).slice(0, 5)}
      </button>
    )
  }

  // Minimized — small floating pill
  if (view === 'minimized') {
    return (
      <div ref={widgetRef} onMouseDown={onDragStart} onTouchStart={onDragStart}
        style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 60, transform: `translate(${pos.x}px, ${pos.y}px)`, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 10, paddingTop: 8, paddingBottom: 8, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', cursor: dragging ? 'grabbing' : 'grab' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(timeLeft)}</span>
        <button onClick={e => { e.stopPropagation(); toggle() }}
          style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: isDark ? '#0a0a0a' : '#fff', border: 'none', cursor: 'pointer' }}>
          {running ? <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="3" height="8" rx="0.5"/><rect x="6" y="1" width="3" height="8" rx="0.5"/></svg> : <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="1,0 9,5 1,10"/></svg>}
        </button>
        <button onClick={e => { e.stopPropagation(); setView('widget') }} style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer' }}><Maximize2 size={9} /></button>
        <button onClick={e => { e.stopPropagation(); setView('hidden') }} style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={9} /></button>
      </div>
    )
  }

  // Full widget
  return (
    <div ref={widgetRef} onMouseDown={onDragStart} onTouchStart={onDragStart}
      style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 60, transform: `translate(${pos.x}px, ${pos.y}px)`, width: 280, borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.25)', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 10, paddingTop: 10, paddingBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Timer</span>
        <div style={{ display: 'flex', gap: 3 }}>
          <button onClick={e => { e.stopPropagation(); setView('fullscreen') }} style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Fullscreen"><Maximize2 size={10} /></button>
          <button onClick={e => { e.stopPropagation(); setView('minimized') }} style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10} /></button>
          <button onClick={e => { e.stopPropagation(); setView('hidden') }} style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 10, marginLeft: 12, marginRight: 12, padding: 3, borderRadius: 10, background: 'var(--bg)' }}>
        {(['focus', 'break'] as const).map(m => (
          <button key={m} onClick={e => { e.stopPropagation(); switchMode(m) }}
            style={{ flex: 1, paddingTop: 5, paddingBottom: 5, borderRadius: 8, fontSize: 11, fontWeight: 500, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
              background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? (isDark ? '#0a0a0a' : '#fff') : 'var(--text-dim)' }}>
            {m === 'focus' ? 'Focus' : 'Break'}
          </button>
        ))}
      </div>

      {/* Focus Task */}
      {focusTask && (
        <div style={{ margin: '0 12px', marginBottom: 8, padding: '5px 8px', borderRadius: 6, background: 'var(--bg)', fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>●</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{focusTask.name}</span>
          <button onClick={e => { e.stopPropagation(); setFocusTask(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 9 }}>×</button>
        </div>
      )}

      {/* Add to Calendar */}
      {calendarConnected && focusTask && mode === 'focus' && (
        <div onClick={e => e.stopPropagation()} style={{ margin: '0 12px', marginBottom: 8 }}>
          <label style={{ padding: '5px 8px', borderRadius: 6, background: 'var(--bg)', fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={addToCalendar} onChange={toggleAddToCalendar} disabled={running} style={{ accentColor: 'var(--accent)', width: 12, height: 12 }} />
            <Calendar size={10} style={{ color: 'var(--text-dim)' }} />
            <span>{addToCalendar ? 'Added to Calendar' : 'Add to Google Calendar'}</span>
          </label>
          {calendarMsg && <p style={{ fontSize: 9, color: calendarMsg.includes('Failed') ? 'var(--danger)' : 'var(--accent)', marginTop: 2, paddingLeft: 8 }}>{calendarMsg}</p>}
        </div>
      )}

      {/* Timer Display */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: 12, paddingRight: 12, paddingBottom: 4 }}>
        <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 6 }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--ring-bg)" strokeWidth="4" />
            <circle cx="50" cy="50" r={R} fill="none" stroke={mode === 'focus' ? 'var(--accent)' : 'var(--text-dim)'} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className={running ? 'timer-running' : ''} style={{ fontSize: 26, fontWeight: 300, letterSpacing: 2, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{fmt(timeLeft)}</span>
          </div>
        </div>

        {/* Direct Time Input */}
        {!running && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}>
            <input type="number" value={inputMin} onChange={e => applyTimeInput(e.target.value, inputSec)}
              style={{ width: 40, height: 28, textAlign: 'center', borderRadius: 6, fontSize: 13, fontWeight: 500, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} min={0} max={999} />
            <span style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-dim)' }}>:</span>
            <input type="number" value={inputSec} onChange={e => applyTimeInput(inputMin, e.target.value)}
              style={{ width: 40, height: 28, textAlign: 'center', borderRadius: 6, fontSize: 13, fontWeight: 500, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} min={0} max={59} />
          </div>
        )}
        {!running && mode === 'break' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, fontSize: 10, color: 'var(--text-dim)' }}
            onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            <span>Break:</span>
            <input type="number" value={breakMin} onChange={e => { const v = Math.max(1, Math.min(30, parseInt(e.target.value) || 1)); setBreakMin(v); setTimeLeft(v * 60); setInputMin(String(v)); setInputSec('00') }}
              style={{ width: 32, height: 22, textAlign: 'center', borderRadius: 4, fontSize: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} min={1} max={30} />
            <span>min</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingLeft: 12, paddingRight: 12, paddingBottom: 14 }}>
        <button onClick={e => { e.stopPropagation(); toggle() }}
          style={{ paddingTop: 7, paddingBottom: 7, paddingLeft: 24, paddingRight: 24, borderRadius: 9999, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: running ? 'var(--text)' : 'var(--accent)', color: running ? 'var(--bg)' : (isDark ? '#0a0a0a' : '#fff') }}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={e => { e.stopPropagation(); reset() }}
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'none', cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
        </button>
      </div>
    </div>
  )
}

function fmt(s: number) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }
