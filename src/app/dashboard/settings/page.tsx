'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sun, Moon, LogOut, User, Mail, ChevronRight } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = createClient()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else { setUser(user); setName(user.user_metadata?.full_name || ''); setLoading(false) }
    })
  }, [])

  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  const saveName = async () => {
    if (!name.trim()) return
    setSaving(true)
    setMsg('')
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    if (error) { setMsg(error.message) } else {
      setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: name.trim() } })
      setEditingName(false)
      setMsg('Name updated!')
      setTimeout(() => setMsg(''), 2000)
    }
    setSaving(false)
  }

  if (loading) return <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: 'var(--text-dim)' }}>Loading...</p>

  const displayName = user?.user_metadata?.full_name || 'User'
  const initial = displayName[0]?.toUpperCase() || 'U'

  return (
    <div style={{ paddingBottom: 96 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Settings</h1>

      {/* Profile Card */}
      <div style={{ padding: 16, borderRadius: 16, marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
        </div>

        {/* Edit Name */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editingName ? 8 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={16} style={{ color: 'var(--text-dim)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Name</span>
            </div>
            {!editingName && (
              <button onClick={() => { setEditingName(true); setName(user?.user_metadata?.full_name || '') }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer' }}>
                Edit <ChevronRight size={12} />
              </button>
            )}
          </div>
          {editingName && (
            <div>
              <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && saveName()}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 13, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveName} disabled={saving || !name.trim()}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer', opacity: saving || !name.trim() ? 0.5 : 1 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingName(false)}
                  style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {msg && <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>{msg}</p>}
        </div>
      </div>

      {/* Appearance */}
      <div style={{ borderRadius: 16, marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginBottom: 4 }}>Appearance</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDark ? <Moon size={16} style={{ color: 'var(--text-dim)' }} /> : <Sun size={16} style={{ color: 'var(--text-dim)' }} />}
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Theme</span>
          </div>
          <button onClick={toggleTheme} className="theme-toggle">
            <Sun className="ico ico-sun" style={{ color: 'var(--text)' }} />
            <Moon className="ico ico-moon" style={{ color: 'var(--text)' }} />
          </button>
        </div>
      </div>

      {/* Account */}
      <div style={{ borderRadius: 16, marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginBottom: 4 }}>Account</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <Mail size={16} style={{ color: 'var(--text-dim)' }} />
          <div>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)', marginBottom: 2 }}>Email</p>
            <p style={{ fontSize: 13, color: 'var(--text)' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={logout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13 }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}
