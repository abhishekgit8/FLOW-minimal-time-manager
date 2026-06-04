'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) } else { setSuccess(true); setLoading(false) }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 200, letterSpacing: 6, color: 'var(--text)', textDecoration: 'none' }}>Flow</Link>
        <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-dim)' }}>Create your account</p>
      </div>

      <div style={{ padding: 24, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <button onClick={handleGoogleLogin}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 10, fontSize: 13, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {error && (
          <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 12, background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Check <span style={{ color: 'var(--text)' }}>{email}</span> to verify your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 8 }} />
            <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13, outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 12 }} />
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, marginTop: 16, color: 'var(--text-dim)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </div>
  )
}
