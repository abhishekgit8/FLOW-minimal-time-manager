export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 16, paddingRight: 16, background: 'var(--bg)' }}>
      {children}
    </div>
  )
}
