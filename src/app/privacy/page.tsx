export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', color: '#e5e5e5', background: '#0a0a0a', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Privacy Policy</h1>
      <p style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 16, lineHeight: 1.7 }}>
        <strong>Flow — Time Manager</strong> (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 24, marginBottom: 12 }}>Information We Collect</h2>
      <ul style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.7, paddingLeft: 20 }}>
        <li><strong>Account information:</strong> Email address and name (via Google Sign-In or email signup)</li>
        <li><strong>Task data:</strong> Tasks you create, including names, descriptions, priorities, and categories</li>
        <li><strong>Focus sessions:</strong> Duration and completion times of your focus sessions</li>
        <li><strong>Calendar data:</strong> We create Google Calendar events when you opt in. We store only the access tokens needed to do so.</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 24, marginBottom: 12 }}>How We Use Your Information</h2>
      <ul style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.7, paddingLeft: 20 }}>
        <li>To provide and maintain the service</li>
        <li>To track your focus sessions and productivity stats</li>
        <li>To create calendar events when you enable the integration</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 24, marginBottom: 12 }}>Data Storage & Security</h2>
      <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.7 }}>
        Your data is stored securely in Supabase (PostgreSQL) with Row Level Security enabled, meaning only you can access your own data. OAuth tokens are encrypted at rest.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 24, marginBottom: 12 }}>Data Sharing</h2>
      <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.7 }}>
        We do not sell, trade, or share your personal information with third parties. The only external service we interact with is Google Calendar, and only when you explicitly enable the integration.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 24, marginBottom: 12 }}>Data Deletion</h2>
      <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.7 }}>
        You can delete your tasks and focus sessions at any time from the app. To delete your entire account and all associated data, contact us at the email below.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 24, marginBottom: 12 }}>Contact</h2>
      <p style={{ fontSize: 14, color: '#a3a3a3', lineHeight: 1.7 }}>
        For questions about this policy, contact: <a href="mailto:abhishekpv1972@gmail.com" style={{ color: '#f59e0b' }}>abhishekpv1972@gmail.com</a>
      </p>

      <p style={{ fontSize: 12, color: '#525252', marginTop: 40 }}>Last updated: June 2026</p>
    </div>
  )
}
