'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20, textAlign: 'center' }}>
      <p style={{ fontSize: 64, fontWeight: 200, color: 'var(--danger)', marginBottom: 8 }}>!</p>
      <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Something went wrong</h1>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24, maxWidth: 400 }}>{error.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} style={{ padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  )
}
