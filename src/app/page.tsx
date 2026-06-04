import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 16, paddingRight: 16, background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 48, fontWeight: 200, letterSpacing: 8, marginBottom: 12, color: 'var(--text)' }}>Flow</h1>
          <div style={{ width: 32, height: 1, background: 'var(--accent)', margin: '0 auto 20px' }} />
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-dim)' }}>
            A minimal time manager for maximum productivity.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4, opacity: 0.6 }}>
            Focus. Track. Ship.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/login"
            style={{ paddingLeft: 28, paddingRight: 28, paddingTop: 10, paddingBottom: 10, fontSize: 13, fontWeight: 600, borderRadius: 9999, background: 'var(--accent)', color: 'var(--bg)', textDecoration: 'none' }}>
            Sign In
          </Link>
          <Link href="/signup"
            style={{ paddingLeft: 28, paddingRight: 28, paddingTop: 10, paddingBottom: 10, fontSize: 13, fontWeight: 500, borderRadius: 9999, border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none' }}>
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
