import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20, textAlign: 'center' }}>
      <p style={{ fontSize: 64, fontWeight: 200, color: 'var(--text-dim)', marginBottom: 8 }}>404</p>
      <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Page not found</h1>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24 }}>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/dashboard" style={{ padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: 'var(--bg)', textDecoration: 'none' }}>
        Go to Dashboard
      </Link>
    </div>
  )
}
